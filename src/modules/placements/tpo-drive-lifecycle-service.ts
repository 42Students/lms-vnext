import "server-only";

import { and, count, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementCompanies,
  placementCompanyRelationships,
  placementJobEligibilityPolicies,
  placementJobRoleOptions,
  placementJobRounds,
  placementJobs,
  placementOffers,
  placementRoundResults,
  placementSeasons,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import {
  evaluateTpoDriveLifecycle,
  tpoDriveLifecycleSchema,
  type TpoDriveReadinessFacts,
} from "./tpo-drive-lifecycle-model";
import { requirePlacementManageScope } from "./scope";
import { placementJobIdSchema } from "./validation";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function requireTpo(context: RequestContext): string {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  return collegeId;
}

async function loadFacts(
  tx: Tx,
  job: typeof placementJobs.$inferSelect,
  now: Date,
): Promise<TpoDriveReadinessFacts> {
  const [season] = await tx.select({ status: placementSeasons.status })
    .from(placementSeasons).where(and(
      eq(placementSeasons.id, job.seasonId),
      eq(placementSeasons.collegeId, job.collegeId),
    )).limit(1);
  const [company] = await tx.select({
    relationshipStatus: placementCompanyRelationships.status,
    companyStatus: placementCompanies.status,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies, eq(
      placementCompanies.id, placementCompanyRelationships.companyId,
    )).where(and(
      eq(placementCompanyRelationships.id, job.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, job.collegeId),
    )).limit(1);
  const [roles, rounds, policy, results, offers] = await Promise.all([
    tx.select({ count: count() }).from(placementJobRoleOptions).where(and(
      eq(placementJobRoleOptions.jobId, job.id),
      eq(placementJobRoleOptions.status, "ACTIVE"),
    )),
    tx.select({ count: count() }).from(placementJobRounds).where(and(
      eq(placementJobRounds.jobId, job.id),
      ne(placementJobRounds.kind, "TALK"),
      ne(placementJobRounds.status, "CANCELLED"),
    )),
    tx.select({ jobId: placementJobEligibilityPolicies.jobId })
      .from(placementJobEligibilityPolicies)
      .where(eq(placementJobEligibilityPolicies.jobId, job.id)).limit(1),
    tx.select({ count: count() }).from(placementRoundResults)
      .innerJoin(placementJobRounds, eq(
        placementJobRounds.id, placementRoundResults.roundId,
      ))
      .where(and(
        eq(placementJobRounds.jobId, job.id),
        eq(placementRoundResults.status, "APPLIED"),
      )),
    tx.select({ count: count() }).from(placementOffers)
      .innerJoin(placementApplications, eq(
        placementApplications.id, placementOffers.applicationId,
      ))
      .where(and(
        eq(placementApplications.jobId, job.id),
        eq(placementOffers.status, "ACCEPTED"),
      )),
  ]);
  return {
    jobStatus: job.status,
    seasonActive: season?.status === "ACTIVE",
    companyActive: company?.relationshipStatus === "ACTIVE" &&
      company.companyStatus === "ACTIVE",
    roleCount: roles[0]?.count ?? 0,
    evaluativeRoundCount: rounds[0]?.count ?? 0,
    policyPersisted: policy.length > 0,
    deadlineValid: job.applicationDeadline === null || job.applicationDeadline > now,
    appliedResultCount: results[0]?.count ?? 0,
    acceptedOfferCount: offers[0]?.count ?? 0,
  };
}

export async function getTpoDriveLifecycleReadiness(
  context: RequestContext, rawJobId: unknown,
) {
  const collegeId = requireTpo(context);
  const jobId = placementJobIdSchema.parse(rawJobId);
  const [job] = await getDb().select().from(placementJobs).where(and(
    eq(placementJobs.id, jobId),
    eq(placementJobs.collegeId, collegeId),
  )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  await requirePlacementManageScope(context, job.collegeId);
  const facts = await getDb().transaction((tx) => loadFacts(tx, job, new Date()));
  return {
    jobId,
    status: job.status,
    facts,
    publish: evaluateTpoDriveLifecycle("PUBLISH", facts),
    close: evaluateTpoDriveLifecycle("CLOSE", facts),
    reopen: evaluateTpoDriveLifecycle("REOPEN", facts),
  };
}

export async function changeTpoDriveLifecycle(
  context: RequestContext,
  rawJobId: unknown,
  raw: unknown,
) {
  const collegeId = requireTpo(context);
  const jobId = placementJobIdSchema.parse(rawJobId);
  const input = tpoDriveLifecycleSchema.parse(raw);
  const [owned] = await getDb().select({
    id: placementJobs.id, collegeId: placementJobs.collegeId,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, jobId),
    eq(placementJobs.collegeId, collegeId),
  )).limit(1);
  if (!owned) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  await requirePlacementManageScope(context, owned.collegeId);
  return getDb().transaction(async (tx) => {
    const [job] = await tx.select().from(placementJobs).where(and(
      eq(placementJobs.id, jobId),
      eq(placementJobs.collegeId, collegeId),
    )).for("update").limit(1);
    if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
    if (job.status !== input.expectedStatus) {
      throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
    }
    const facts = await loadFacts(tx, job, new Date());
    const decision = evaluateTpoDriveLifecycle(input.action, facts);
    if (!decision.allowed) {
      throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
    }
    const now = new Date();
    const toStatus = input.action === "CLOSE" ? "CLOSED" : "PUBLISHED";
    const [updated] = await tx.update(placementJobs).set({
      status: toStatus,
      ...(input.action === "PUBLISH" ? { publishedAt: now } : {}),
      ...(input.action === "CLOSE" ? { closedAt: now } : { closedAt: null }),
      updatedAt: now,
    }).where(and(
      eq(placementJobs.id, job.id),
      eq(placementJobs.status, input.expectedStatus),
    )).returning();
    if (!updated) throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
    await recordActivityEventInTransaction(tx, context, {
      eventType: input.action === "CLOSE"
        ? ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_CLOSED
        : ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
      collegeId,
      subjectType: "placement_job",
      subjectId: jobId,
      subjectLabel: job.title,
      summary: "TPO " + input.action.toLowerCase() + " drive " + job.title,
      metadata: {
        action: input.action,
        fromStatus: job.status,
        toStatus,
        reason: input.reason,
        actorRole: "TPO",
      },
      groupKey: "placement-job:" + jobId,
    });
    return {
      id: updated.id,
      status: updated.status,
      blockers: [] as string[],
    };
  });
}
