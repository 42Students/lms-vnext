import "server-only";
import {z} from "zod";

import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  db10LogAlertSignatures,
  db10LogAlertSignatureAccounts,
  db10LogAlertStates,
} from "@/db/schema/db10-log-alerts.draft";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import {
  knownErrorIdSchema,
  knownErrorListSchema,
  knownErrorMutationSchema,
} from "./validation";
import { knownErrorTriagePatch } from "./triage-policy";

export class LogAlertsAdminError extends Error {
  constructor(readonly code: "FORBIDDEN" | "KNOWN_ERROR_NOT_FOUND") {
    super(code);
    this.name = "LogAlertsAdminError";
  }
}

/**
 * Raw Cloud Logging is a platform-global source; scoped college/org admins
 * cannot see it. Server role AND cleared safety scope are mandatory.
 */
export function requireGlobalLogAdmin(context: RequestContext) {
  if (!isSuperAdmin(context) ||
      context.adminScope?.collegeId ||
      context.adminScope?.organizationId) {
    throw new LogAlertsAdminError("FORBIDDEN");
  }
}

const STATE_KEY = "PRODUCTION_ERROR_POLL";

/** Legacy LogAlertSignature ID is the vNext signature UUID. A hash is
 * never used as a global lookup key: all reads include the environment.
 * Existing callers receive the same list array, with optional paging.
 */
export const knownErrorListPageSchema=knownErrorListSchema.safeExtend({
 offset:z.coerce.number().int().min(0).max(100000).default(0),
});
export const LOG_ALERT_AFFECTED_ACCOUNTS_LABEL="Distinct accounts (blast radius)";
export const LOG_ALERT_UNKNOWN_ACCOUNTS_COPY="Unknown · no verified account marker";

export async function listKnownErrorsForAdmin(context: RequestContext, raw: unknown) {
  requireGlobalLogAdmin(context);
  const input = knownErrorListPageSchema.parse(raw);
  const rows = await getDb()
    .select({
      id: db10LogAlertSignatures.id,
      environment: db10LogAlertSignatures.environment,
      signatureHash: db10LogAlertSignatures.signatureHash,
      firstSeenAt: db10LogAlertSignatures.firstSeenAt,
      lastSeenAt: db10LogAlertSignatures.lastSeenAt,
      occurrenceCount: db10LogAlertSignatures.occurrenceCount,
      muted: db10LogAlertSignatures.muted,
      fixStatus: db10LogAlertSignatures.fixStatus,
      fixedAt: db10LogAlertSignatures.fixedAt,
      fixedInCommit: db10LogAlertSignatures.fixedInCommit,
      regressedAt: db10LogAlertSignatures.regressedAt,
      statusNote: db10LogAlertSignatures.statusNote,
      mutedReason: db10LogAlertSignatures.mutedReason,
      issuePublicId: db10LogAlertSignatures.issuePublicId,
      acknowledgedAt: db10LogAlertSignatures.acknowledgedAt,
    })
    .from(db10LogAlertSignatures)
    .where(eq(db10LogAlertSignatures.environment, input.environment))
    .orderBy(desc(db10LogAlertSignatures.lastSeenAt), desc(db10LogAlertSignatures.id))
    .limit(input.limit)
    .offset(input.offset);

  const counts = rows.length
    ? await getDb()
        .select({
          signatureId: db10LogAlertSignatureAccounts.signatureId,
          total: count(),
        })
        .from(db10LogAlertSignatureAccounts)
        .where(inArray(db10LogAlertSignatureAccounts.signatureId, rows.map(row => row.id)))
        .groupBy(db10LogAlertSignatureAccounts.signatureId)
    : [];
  const countBySignature = new Map(counts.map(row => [row.signatureId, row.total]));

  return rows.map(row => ({
    ...row,
    // PostgreSQL bigint is not safely JSON-serializable as JS number.
    occurrenceCount: row.occurrenceCount.toString(),
    // No verified account marker is an unknown blast radius, not proof
    // that the alert affected zero accounts. Preserve legacy nullable count.
    affectedAccounts: countBySignature.get(row.id) ?? null,
    distinctAccountCount: countBySignature.get(row.id) ?? null,
    // No raw log sample, stack, paths, tokens, account IDs or HMACs in response.
  }));
}

/** Operators can traverse all signatures while keeping each page restricted
 * to its selected environment; count does not expose account identifiers. */
export async function pageKnownErrorsForAdmin(context:RequestContext,raw:unknown){
 requireGlobalLogAdmin(context);
 const query=knownErrorListPageSchema.parse(raw);
 const [items,total]=await Promise.all([
  listKnownErrorsForAdmin(context,query),
  getDb().select({total:sql<number>`count(*)::integer`})
   .from(db10LogAlertSignatures)
   .where(eq(db10LogAlertSignatures.environment,query.environment)),
 ]);
 const totalCount=total[0]?.total??0;
 return {environment:query.environment,items,offset:query.offset,
  limit:query.limit,total:totalCount,
  hasMore:query.offset+items.length<totalCount,
  nextOffset:query.offset+items.length<totalCount?query.offset+items.length:null};
}

export async function mutateKnownErrorForAdmin(
  context: RequestContext,
  idRaw: string,
  mutationRaw: unknown,
) {
  requireGlobalLogAdmin(context);
  const id = knownErrorIdSchema.parse(idRaw);
  const mutation = knownErrorMutationSchema.parse(mutationRaw);
  return getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(db10LogAlertSignatures)
      .where(eq(db10LogAlertSignatures.id, id))
      .limit(1)
      .for("update");
    if (!current) throw new LogAlertsAdminError("KNOWN_ERROR_NOT_FOUND");
    if (mutation.action === "ACKNOWLEDGE") {
      const [ack] = await tx.update(db10LogAlertSignatures)
        .set({ acknowledgedAt: new Date() })
        .where(eq(db10LogAlertSignatures.id, id))
        .returning({ id: db10LogAlertSignatures.id, acknowledgedAt: db10LogAlertSignatures.acknowledgedAt });
      return ack;
    }
    const patch = knownErrorTriagePatch({
      fixStatus: current.fixStatus as "OPEN" | "FIXED" | "EXPECTED",
      muted: current.muted,
      mutedReason: current.mutedReason,
      fixedAt: current.fixedAt,
      fixedInCommit: current.fixedInCommit,
      regressedAt: current.regressedAt,
      statusNote: current.statusNote,
      issuePublicId: current.issuePublicId,
    }, mutation, new Date());
    const [updated] = await tx.update(db10LogAlertSignatures)
      .set(patch)
      .where(eq(db10LogAlertSignatures.id, id))
      .returning({
        id: db10LogAlertSignatures.id,
        muted: db10LogAlertSignatures.muted,
        fixStatus: db10LogAlertSignatures.fixStatus,
        issuePublicId: db10LogAlertSignatures.issuePublicId,
      });
    return updated;
  });
}

export async function readLogAlertAdminState(context: RequestContext) {
  requireGlobalLogAdmin(context);
  const [row] = await getDb().select({
    pollCursorAt: db10LogAlertStates.pollCursorAt,
    adminLastViewedAt: db10LogAlertStates.adminLastViewedAt,
  }).from(db10LogAlertStates)
    .where(eq(db10LogAlertStates.stateKey, STATE_KEY))
    .limit(1);
  return row ?? { pollCursorAt: null, adminLastViewedAt: null };
}

export async function markLogAlertsViewed(context: RequestContext) {
  requireGlobalLogAdmin(context);
  const [state] = await getDb().insert(db10LogAlertStates)
    .values({
      stateKey: STATE_KEY,
      adminLastViewedAt: sql`clock_timestamp()`,
    })
    .onConflictDoUpdate({
      target: db10LogAlertStates.stateKey,
      // Never include pollCursorAt: scheduler owns the independent column.
      set: {
        adminLastViewedAt: sql`greatest(coalesce(${db10LogAlertStates.adminLastViewedAt}, '-infinity'::timestamptz), clock_timestamp())`,
      },
    })
    .returning({ adminLastViewedAt: db10LogAlertStates.adminLastViewedAt });
  return state?.adminLastViewedAt ?? null;
}
