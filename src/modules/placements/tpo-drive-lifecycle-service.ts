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
  hasSecureEmployerPortalUrl,
  tpoDriveLifecycleSchema,
  type TpoDriveReadinessFacts,
} from "./tpo-drive-lifecycle-model";
import { requirePlacementManageScope } from "./scope";
import { placementJobIdSchema } from "./validation";
import {
  countPublishedDriveDebarments,notifyEligiblePublishedDrive,
  previewEligiblePublishedDrive,
} from "./tpo-drive-publish-effects";

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
    tx.select({
      minimum:placementJobRoleOptions.minimumAnnualCtcInr,
      maximum:placementJobRoleOptions.maximumAnnualCtcInr,
    }).from(placementJobRoleOptions).where(and(
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
    roleCount: roles.length,
    evaluativeRoundCount: rounds[0]?.count ?? 0,
    policyPersisted: policy.length > 0,
    deadlineValid: job.applicationDeadline === null || job.applicationDeadline > now,
    deadlinePresent: job.applicationDeadline !== null,
    payPresent: job.minimumAnnualCtcInr !== null || job.maximumAnnualCtcInr !== null ||
      job.stipendPerMonthInr !== null ||
      roles.some(role => role.minimum !== null || role.maximum !== null),
    externalUrlPresent: hasSecureEmployerPortalUrl(job.applicationMode,job.externalApplicationUrl),
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
  const [facts,reach] = await getDb().transaction(async tx=>Promise.all([
    loadFacts(tx,job,new Date()),
    job.status==="DRAFT"?previewEligiblePublishedDrive(tx,context,job):
      Promise.resolve({eligible:0,excluded:0,candidateCount:0,recipientUserIds:[]}),
  ]),{accessMode:"read only"});
  return {
    jobId,
    status: job.status,
    // Legacy isDraft/isActive are projections of the single lifecycle enum,
    // never independently writable flags that can contradict the status.
    isDraft: job.status === "DRAFT",
    isActive: job.status === "PUBLISHED",
    facts,
    reach:{eligible:reach.eligible,excluded:reach.excluded,
      considered:reach.candidateCount},
    publish: evaluateTpoDriveLifecycle("PUBLISH", facts),
    close: evaluateTpoDriveLifecycle("CLOSE", facts),
    reopen: evaluateTpoDriveLifecycle("REOPEN", facts),
  };
}

export class TpoPublishEmailUnavailable extends Error {
  constructor(){super("EMAIL_DELIVERY_UNAVAILABLE");this.name="TpoPublishEmailUnavailable";}
}

export async function changeTpoDriveLifecycle(
  context: RequestContext,
  rawJobId: unknown,
  raw: unknown,
) {
  const collegeId = requireTpo(context);
  const jobId = placementJobIdSchema.parse(rawJobId);
  const input = tpoDriveLifecycleSchema.parse(raw);
  // Email is not a configured delivery channel in vNext. Reject a requested
  // email send instead of claiming APP+EMAIL parity without delivery receipts.
  if(input.action==="PUBLISH"&&input.notifyByEmail)
    throw new TpoPublishEmailUnavailable();
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
    const event = await recordActivityEventInTransaction(tx, context, {
      eventType: input.action === "CLOSE"
        ? ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_CLOSED
        : input.action === "REOPEN"
          ? ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_REOPENED
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
    let notifiedCount=0;
    let debarmentCounted=0;
    if(input.action==="PUBLISH"){
      // Reach is decided before a drive-count ban is advanced. The last
      // barred drive must not notify its own excluded learner prematurely.
      notifiedCount=await notifyEligiblePublishedDrive(tx,context,updated,event.id);
      debarmentCounted=await countPublishedDriveDebarments(
        tx,context,updated.id,collegeId,now,
      );
    }
    return {
      id: updated.id,
      status: updated.status,
      isDraft: updated.status === "DRAFT",
      isActive: updated.status === "PUBLISHED",
      blockers: [] as string[],
      notifiedCount,debarmentCounted,emailSent:false,
    };
  });
}
