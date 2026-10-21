import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, placementCollegeRules, placementSeasons } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { createPlacementSeason } from "./season-service";
import { requirePlacementManageScope } from "./scope";
import { tpoRulesChangeSchema, tpoSeasonChangeSchema } from "./tpo-season-write-model";
import { PlacementsServiceError } from "./errors";

/** Legacy openRegistration has no writable vNext season columns yet:
 * isCurrent and isRegistrationOpen are independent of ACTIVE/CLOSED, and a
 * registration deadline is not a season endDate. Never claim registration is
 * open, nor mutate a season's endDate as a surrogate for this operation.
 * The required schema migration + eligibility read must ship atomically with
 * a separately authorized write route, CAS, activity and notification policy. */
export const legacySeasonRegistrationWriteContract = {
 action: "OPEN_REGISTRATION",
 needsColumns: ["is_registration_open", "registration_deadline"],
 mustNotConflateWith: ["status", "endDate"],
 requires: ["scoped TPO actor", "persisted permission", "version check",
   "audited season transition", "learner eligibility reads"],
 supported: false,
} as const;

export class TpoSettingsStaleError extends Error {
  constructor() { super("TPO_SETTINGS_STALE"); this.name = "TpoSettingsStaleError"; }
}
async function requireTpo(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO") || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = member.collegeId;
  if (!can(context, "placements.manage", { collegeId })) throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  const college = await requirePlacementManageScope(context, collegeId);
  return { collegeId, organizationId: college.organizationId, actorMembershipId: member.id, actorUserId: context.user.id };
}

export async function changeTpoSeason(context: RequestContext, raw: unknown) {
  const auth = await requireTpo(context);
  const input = tpoSeasonChangeSchema.parse(raw);
  if (input.action === "CREATE") {
    return createPlacementSeason(context, { collegeId: auth.collegeId,
      name: input.name, code: input.code, startDate: input.startDate, endDate: input.endDate });
  }
  return getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(placementSeasons)
      .where(and(eq(placementSeasons.id, input.seasonId), eq(placementSeasons.collegeId, auth.collegeId)))
      .for("update").limit(1);
    if (!current) throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_FOUND");
    if (current.status !== "ACTIVE") throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_ACTIVE");
    if (current.updatedAt.toISOString() !== new Date(input.expectedUpdatedAt).toISOString()) {
      throw new TpoSettingsStaleError();
    }
    const duplicates = await tx.select({ id: placementSeasons.id, code: placementSeasons.code })
      .from(placementSeasons).where(eq(placementSeasons.collegeId, auth.collegeId));
    if (duplicates.some((row) => row.id !== current.id &&
      row.code.toLocaleLowerCase("en") === input.code.toLocaleLowerCase("en"))) {
      throw new PlacementsServiceError("PLACEMENT_SEASON_CODE_CONFLICT");
    }
    if (current.name === input.name && current.code === input.code &&
      current.startDate === input.startDate && current.endDate === input.endDate) return current;
    const now = new Date();
    const [updated] = await tx.update(placementSeasons).set({
      name: input.name, code: input.code, startDate: input.startDate,
      endDate: input.endDate, updatedAt: now,
    }).where(and(eq(placementSeasons.id, current.id), eq(placementSeasons.collegeId, auth.collegeId))).returning();
    if (!updated) throw new TpoSettingsStaleError();
    await tx.insert(activityEvents).values({
      organizationId: auth.organizationId, collegeId: auth.collegeId,
      actorUserId: auth.actorUserId, actorMembershipId: auth.actorMembershipId,
      module: "PLACEMENTS", eventType: "PLACEMENTS_SEASON_DETAILS_UPDATED",
      subjectType: "placement_season", subjectId: current.id, subjectLabel: current.name,
      summary: "Placement season details updated",
      metadata: { before: { name: current.name, code: current.code, startDate: current.startDate, endDate: current.endDate },
        after: { name: updated.name, code: updated.code, startDate: updated.startDate, endDate: updated.endDate } },
      occurredAt: now,
    });
    return updated;
  });
}

export async function changeTpoRules(context: RequestContext, raw: unknown) {
  const auth = await requireTpo(context);
  const input = tpoRulesChangeSchema.parse(raw);
  return getDb().transaction(async (tx) => {
    if (input.expectedVersion === 0) {
      await tx.insert(placementCollegeRules).values({ collegeId: auth.collegeId })
        .onConflictDoNothing();
    }
    const [before] = await tx.select().from(placementCollegeRules)
      .where(eq(placementCollegeRules.collegeId, auth.collegeId)).for("update").limit(1);
    if (!before || before.version !== input.expectedVersion) throw new TpoSettingsStaleError();
    const next = {
      countsAsPlacedAt: input.countsAsPlacedAt, maxHeldOffers: input.maxHeldOffers,
      upliftPct: input.upliftPct, minResponseHours: input.minResponseHours,
    };
    if (before.countsAsPlacedAt === next.countsAsPlacedAt &&
      before.maxHeldOffers === next.maxHeldOffers &&
      before.upliftPct === next.upliftPct &&
      before.minResponseHours === next.minResponseHours) return before;
    const now = new Date();
    const [updated] = await tx.update(placementCollegeRules).set({
      ...next, version: sql.raw("version + 1"), updatedAt: now,
    }).where(and(eq(placementCollegeRules.collegeId, auth.collegeId),
      eq(placementCollegeRules.version, before.version))).returning();
    if (!updated) throw new TpoSettingsStaleError();
    await tx.insert(activityEvents).values({
      organizationId: auth.organizationId, collegeId: auth.collegeId,
      actorUserId: auth.actorUserId, actorMembershipId: auth.actorMembershipId,
      module: "PLACEMENTS", eventType: "PLACEMENTS_COLLEGE_RULES_UPDATED",
      subjectType: "placement_college_rules", subjectId: auth.collegeId, subjectLabel: "College placement rules",
      summary: "Placement rules updated",
      metadata: { from: {
        countsAsPlacedAt: before.countsAsPlacedAt, maxHeldOffers: before.maxHeldOffers,
        upliftPct: before.upliftPct, minResponseHours: before.minResponseHours,
      }, to: next, fromVersion: before.version, toVersion: updated.version },
      occurredAt: now,
    });
    return updated;
  });
}
