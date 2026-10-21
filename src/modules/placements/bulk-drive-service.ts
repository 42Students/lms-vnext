import "server-only";
import {recordApplicationStatusTransition} from "./application-status-history-writer";


import { and, asc, eq, ilike, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  activityEvents, collegeMemberships, membershipRoles, placementApplications, placementCompanies, placementCompanyRelationships,
  placementApplicationScreenings, placementApplicationStatusHistory,
  placementDriveDayCoordinatorAssignments, placementJobRoleOptions,
  placementJobs, placementSeasons, placementDebarments, placementEligibilityOverrides, inAppNotifications, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { evaluatePlacementEligibility } from "./eligibility-service";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { isPlacementApplicationDeadlinePassed } from "./application-deadline-policy";
import {
  bulkDriveAddSchema, bulkDriveCandidatesQuerySchema, bulkDrivePreflightSchema,
  bulkDriveOutcome, bulkDriveCounts, type BulkDriveResult,
} from "./bulk-drive-model";
import { placementJobIdSchema } from "./validation";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";
import { hasActivePlacementDebarment } from "./placement-debarment-gate";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function requireTpo(context: RequestContext) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", {
    collegeId: context.membership.collegeId,
  });
  return context.membership;
}

async function loadManagedDrive(context: RequestContext, jobId: string) {
  const membership = requireTpo(context);
  const [job] = await getDb().select({
    id: placementJobs.id, collegeId: placementJobs.collegeId,
    status: placementJobs.status, archivedAt: placementJobs.archivedAt,
    applicationDeadline: placementJobs.applicationDeadline,
    applicationMode: placementJobs.applicationMode,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, jobId),
    eq(placementJobs.collegeId, membership.collegeId),
  )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  await requirePlacementManageScope(context, job.collegeId);
  if (!can(context, "placements.manage", { collegeId: job.collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  return job;
}

/** Paginated active-learner roster, not a claim that every listed learner is eligible. */
export async function listBulkDriveCandidates(
  context: RequestContext, rawJobId: string, rawQuery: unknown = {},
) {
  requireTpo(context);
  const jobId = placementJobIdSchema.parse(rawJobId);
  const query = bulkDriveCandidatesQuerySchema.parse(rawQuery);
  const job = await loadManagedDrive(context, jobId);
  const conditions = and(
    eq(collegeMemberships.collegeId, job.collegeId),
    eq(collegeMemberships.status, "ACTIVE"),
    eq(users.platformStatus, "ACTIVE"),
    eq(membershipRoles.role, "LEARNER"),
    query.search ? ilike(users.displayName, "%" + query.search + "%") : undefined,
  );
  const rows = await getDb().select({
    membershipId: collegeMemberships.id,
    displayName: users.displayName,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
    .where(conditions)
    .orderBy(asc(users.displayName), asc(collegeMemberships.id))
    .limit(26).offset((query.page - 1) * 25);
  return {
    learners: rows.slice(0, 25).map((row) => ({
      membershipId: row.membershipId,
      displayName: row.displayName || "Unnamed learner",
    })),
    page: query.page,
    hasMore: rows.length > 25,
  };
}

/** Read-only preview: a current active application is not a fresh addition. */
export async function previewBulkDriveAdd(
 context:RequestContext,rawJobId:string,rawInput:unknown,
){
 const input=bulkDrivePreflightSchema.parse(rawInput);
 const job=await loadManagedDrive(context,placementJobIdSchema.parse(rawJobId));
 const [role]=await getDb().select({id:placementJobRoleOptions.id})
  .from(placementJobRoleOptions).where(and(
   eq(placementJobRoleOptions.id,input.roleOptionId),
   eq(placementJobRoleOptions.jobId,job.id),
   eq(placementJobRoleOptions.status,"ACTIVE"))).limit(1);
 if(!role)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const rows=await getDb().select({membershipId:placementApplications.membershipId})
  .from(placementApplications).where(and(
    eq(placementApplications.jobId,job.id),
    eq(placementApplications.roleOptionId,input.roleOptionId),
    eq(placementApplications.status,"SUBMITTED"),
    inArray(placementApplications.membershipId,input.membershipIds),
  ));
 return {alreadyAppliedCount:new Set(rows.map(row=>row.membershipId)).size,
  totalChecked:input.membershipIds.length};
}

async function loadLearner(tx: Tx, collegeId: string, membershipId: string) {
  const [row] = await tx.select({
    membershipId: collegeMemberships.id,
    collegeId: collegeMemberships.collegeId,
    userId: users.id,
    identityUid: users.identityUid,
    platformStatus: users.platformStatus,
    membershipStatus: collegeMemberships.status,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(collegeMemberships.id, membershipId),
      eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    )).for("share").limit(1);
  return row ?? null;
}

class UnsafeForceInclude extends Error {}

async function addOne(
  context: RequestContext,
  job: Awaited<ReturnType<typeof loadManagedDrive>>,
  roleOptionId: string,
  membershipId: string,
  includeIneligibleReason?:string,
): Promise<BulkDriveResult> {
  // Run the existing learner participation and job eligibility readers
  // BEFORE opening a write transaction: those readers use getDb() and
  // otherwise exhaust a DB_POOL_MAX=1 connection pool.
  const [existingBefore] = await getDb().select({
    status: placementApplications.status,
  }).from(placementApplications).where(and(
    eq(placementApplications.roleOptionId, roleOptionId),
    eq(placementApplications.membershipId, membershipId),
  )).limit(1);
  if (existingBefore) return bulkDriveOutcome(membershipId, {
    existingStatus: existingBefore.status, eligible: false,
  });

  const [preflight] = await getDb().select({
    membershipId: collegeMemberships.id,
    collegeId: collegeMemberships.collegeId,
    userId: users.id,
    identityUid: users.identityUid,
    platformStatus: users.platformStatus,
    membershipStatus: collegeMemberships.status,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(collegeMemberships.id, membershipId),
      eq(collegeMemberships.collegeId, job.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    )).limit(1);
  if (!preflight) return bulkDriveOutcome(membershipId, {
    eligible: false, reason: "Not an active learner in this college",
  });
  // A persisted identity used only to run the existing placement gate.
  // The real TPO remains the recorded application actor.
  const learnerContext: RequestContext = {
    user: {
      id: preflight.userId, identityUid: preflight.identityUid,
      platformStatus: preflight.platformStatus, systemRoles: [],
    },
    membership: {
      id: preflight.membershipId, collegeId: preflight.collegeId,
      organizationId: context.membership!.organizationId,
      status: preflight.membershipStatus, roles: ["LEARNER"],
    },
  };
  try {
    await requireLearnerPlacementAccess(learnerContext);
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
    return bulkDriveOutcome(membershipId, {
      eligible: false, reason: "Learner placement participation is not enabled",
    });
  }
  const eligibility = await evaluatePlacementEligibility(context, job.id, membershipId);
  if (!includeIneligibleReason && (eligibility.status === "INELIGIBLE" || eligibility.status === "NEEDS_DATA")) {
    return bulkDriveOutcome(membershipId, {
      eligible: false, reason: eligibility.status === "NEEDS_DATA"
        ? "Required evidence is missing" : "Drive eligibility requirements not met",
    });
  }

  try{return await getDb().transaction(async (tx) => {
    // Match the self-apply job/role lock order to prevent mid-flight closures.
    const [live] = await tx.select({
      status: placementJobs.status,
      archivedAt: placementJobs.archivedAt,
      mode: placementJobs.applicationMode,
      deadline: placementJobs.applicationDeadline,
      collegeId: placementJobs.collegeId,
      seasonStatus: placementSeasons.status,
    }).from(placementJobs)
      .innerJoin(placementSeasons, eq(placementSeasons.id, placementJobs.seasonId))
      .where(and(
        eq(placementJobs.id, job.id),
        eq(placementJobs.collegeId, job.collegeId),
        eq(placementSeasons.collegeId, job.collegeId),
      )).for("update").limit(1);
    if (!live || live.status !== "PUBLISHED" ||
      live.archivedAt !== null || live.seasonStatus !== "ACTIVE" ||
      live.mode === "EXTERNAL_ONLY" ||
      isPlacementApplicationDeadlinePassed(live.deadline, new Date())) {
      return bulkDriveOutcome(membershipId, {
        eligible: false, reason: "Drive is not open for internal additions",
      });
    }
    const [role] = await tx.select({ id: placementJobRoleOptions.id })
      .from(placementJobRoleOptions).where(and(
        eq(placementJobRoleOptions.id, roleOptionId),
        eq(placementJobRoleOptions.jobId, job.id),
        eq(placementJobRoleOptions.status, "ACTIVE"),
      )).for("share").limit(1);
    if (!role) return bulkDriveOutcome(membershipId, {
      eligible: false, reason: "Role is not active for this drive",
    });

    const learner = await loadLearner(tx, job.collegeId, membershipId);
    if (!learner || learner.userId !== preflight.userId) {
      return bulkDriveOutcome(membershipId, {
        eligible: false, reason: "Learner membership changed before addition",
      });
    }
    const [existing] = await tx.select({ status: placementApplications.status })
      .from(placementApplications).where(and(
        eq(placementApplications.roleOptionId, roleOptionId),
        eq(placementApplications.membershipId, membershipId),
      )).limit(1);
    if (existing) return bulkDriveOutcome(membershipId, {
      existingStatus: existing.status, eligible: false,
    });

    // P-S1-02: management bulk add is not exempt from an active ban.
    const debarments = await tx.select().from(placementDebarments).where(and(
      eq(placementDebarments.collegeId, job.collegeId),
      eq(placementDebarments.membershipId, membershipId),
    )).for("share");
    if (hasActivePlacementDebarment(debarments, new Date())) {
      return bulkDriveOutcome(membershipId, {
        eligible: false, reason: "Drive eligibility requirements not met",
      });
    }

    const [coordinator] = await tx.select({ id: placementDriveDayCoordinatorAssignments.id })
      .from(placementDriveDayCoordinatorAssignments).where(and(
        eq(placementDriveDayCoordinatorAssignments.jobId, job.id),
        eq(placementDriveDayCoordinatorAssignments.collegeId, job.collegeId),
        eq(placementDriveDayCoordinatorAssignments.learnerMembershipId, membershipId),
      )).limit(1);
    if (coordinator) return bulkDriveOutcome(membershipId, {
      eligible: false, reason: "Drive-day coordinators cannot be applicants",
    });

    // Re-evaluate the same college-scoped evidence under the job lock. A
    // reasoned INCLUDE may override ordinary scoring, never hard tenant,
    // cohort, debarment, or verified-proof requirements.
    let forcedInclude=false;
    let finalEligibility=await evaluatePlacementEligibility(context,job.id,membershipId,tx);
    if(finalEligibility.status==="INELIGIBLE"||finalEligibility.status==="NEEDS_DATA"){
      if(!includeIneligibleReason)return bulkDriveOutcome(membershipId,{
        eligible:false,reason:"Drive eligibility requirements not met",
      });
      await tx.update(placementEligibilityOverrides).set({revokedAt:new Date()}).where(and(
        eq(placementEligibilityOverrides.jobId,job.id),
        eq(placementEligibilityOverrides.membershipId,membershipId),
        isNull(placementEligibilityOverrides.revokedAt)));
      const [included]=await tx.insert(placementEligibilityOverrides).values({
       jobId:job.id,membershipId,decision:"INCLUDE",
       reason:includeIneligibleReason,createdByUserId:context.user.id,
      }).returning({id:placementEligibilityOverrides.id});
      finalEligibility=await evaluatePlacementEligibility(context,job.id,membershipId,tx);
      forcedInclude=true;
      if(!["ELIGIBLE","ELIGIBLE_WITH_MISSING_EVIDENCE"].includes(finalEligibility.status)){
       // Rollback restores any previous override and never creates an application.
       throw new UnsafeForceInclude();
      }
      await tx.insert(activityEvents).values({
       organizationId:context.membership!.organizationId,collegeId:job.collegeId,
       actorUserId:context.user.id,actorMembershipId:context.membership!.id,
       module:"PLACEMENTS",eventType:"STUDENTS_ADDED_TO_DRIVE_OVERRIDE",
       subjectType:"placement_eligibility_override",subjectId:included.id,
       summary:"Placement cell included an otherwise ineligible student",
       metadata:{jobId:job.id,membershipId,reason:includeIneligibleReason},
      });
    }
    const [created] = await tx.insert(placementApplications).values({
      jobId: job.id, roleOptionId, membershipId,
      channel: "INTERNAL", eligibilityStatus: finalEligibility.status,
      eligibilitySnapshot: {
        ...finalEligibility, source: "TPO_BULK_ADD", addedByUserId: context.user.id,
        addedByCollege: forcedInclude,
      },
      submittedByUserId: context.user.id,
    }).onConflictDoNothing().returning({ id: placementApplications.id });
    if (!created) throw new UnsafeForceInclude();

    await recordApplicationStatusTransition(tx,{
      applicationId: created.id, fromStatus: null,
      toStatus: "SUBMITTED", actorUserId: context.user.id,
      reason: "TPO bulk Add-to-Drive",
    });
    await tx.insert(placementApplicationScreenings).values({
      applicationId: created.id,
    });
    const activity=await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICATION_SUBMITTED,
      collegeId: job.collegeId,
      subjectType: "placement_application", subjectId: created.id,
      subjectLabel: "TPO bulk addition",
      summary: "TPO added a learner to a placement drive",
      metadata: {
        jobId: job.id, roleOptionId, membershipId, source: "TPO_BULK_ADD",
      },
      groupKey: "placement-job:" + job.id + ":applications",
      dedupeKey: "placement-application:" + created.id + ":submitted",
    });
    await tx.insert(inAppNotifications).values({
      userId:learner.userId,eventId:activity.id,
      title:"You were added to a placement drive",
      body:"Your placement cell added you to a drive. Open My Placements to review the application.",
      actionHref:"/learn/my-placements",
    }).onConflictDoNothing();
    return bulkDriveOutcome(membershipId, { eligible: true });
  });}catch(error){
   if(error instanceof UnsafeForceInclude){
    return bulkDriveOutcome(membershipId,{
     eligible:false,reason:"Cannot override this student's college, cohort or other hard placement restriction",
    });
   }
   throw error;
  }
}

export async function bulkAddLearnersToDrive(
  context: RequestContext, rawJobId: string, rawInput: unknown,
) {
  requireTpo(context);
  const input = bulkDriveAddSchema.parse(rawInput);
  const job = await loadManagedDrive(context, placementJobIdSchema.parse(rawJobId));
  const results: BulkDriveResult[] = [];
  for (const id of input.membershipIds) {
    results.push(await addOne(context, job, input.roleOptionId, id,input.includeIneligible?.reason));
  }
  const added=results.filter(item=>item.status==="added");
  if(added.length){
   // A replay finds existing applications and produces no second summary bell.
   await getDb().transaction(async tx=>{
    const [relationship]=await tx.select({companyName:placementCompanies.name})
     .from(placementJobs)
     .innerJoin(placementCompanyRelationships,and(
       eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
       eq(placementCompanyRelationships.collegeId,placementJobs.collegeId)))
     .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
     .where(and(eq(placementJobs.id,job.id),eq(placementJobs.collegeId,job.collegeId))).limit(1);
    const company=relationship?.companyName??"the company";
    const [event]=await tx.insert(activityEvents).values({
     organizationId:context.membership!.organizationId,collegeId:job.collegeId,
     actorUserId:context.user.id,actorMembershipId:context.membership!.id,
     module:"PLACEMENTS",eventType:"STUDENTS_ADDED_TO_DRIVE",
     subjectType:"placement_job",subjectId:job.id,
     summary:added.length+" student(s) added to "+company,
     metadata:{roleOptionId:input.roleOptionId,studentCount:added.length,
      membershipIds:added.map(item=>item.membershipId)},
    }).returning({id:activityEvents.id});
    if(!event)throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
    const tpo=await tx.selectDistinct({userId:collegeMemberships.userId}).from(collegeMemberships)
     .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
     .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
     .where(and(eq(collegeMemberships.collegeId,job.collegeId),eq(collegeMemberships.status,"ACTIVE")));
    if(tpo.length)await tx.insert(inAppNotifications).values(tpo.map(member=>({
     userId:member.userId,eventId:event.id,title:added.length+" student(s) added to "+company,
     body:"The placement cell added students to a drive. Review the updated application roster.",
     actionHref:"/tpo/placements/jobs/"+encodeURIComponent(job.id),
    }))).onConflictDoNothing();
   });
  }
  return { results, counts: bulkDriveCounts(results) };
}

/** Outbox migration: each learner bell and its application share a DB
 * transaction. The TPO summary bell follows only successful new additions;
 * replayed applications do not enqueue another bell. These are durable
 * in-app rows, NOT evidence of sent SMS or email. No external retry worker
 * is enabled here; DB rollbacks can be safely retried by the caller. */
export const BULK_DRIVE_NOTIFICATION_DELIVERY={
 learner:"TRANSACTIONAL_IN_APP",summary:"DURABLE_POST_ADDITION",
 external:"NOT_CONFIGURED",retry:"REPLAY_SAFE",
} as const;

/** Exact migration guide for legacy TpoApplicantController entry points.
 * All vNext writes require a same-origin authenticated TPO, persisted
 * college-owned UUID scope and validated payloads. Do not interpret a
 * successful preview as an actual mutation.
 */
export const TPO_APPLICANT_API_MIGRATION = [
 {legacy:"GET /tpo/drives/{jobId}/applicants",vNext:"GET applicants-pipeline page",method:"GET",status:200,
  note:"Scoped, paginated pipeline read; not the legacy unpaged JPA entity array"},
 {legacy:"GET /tpo/drives/{jobId}/applicants/not-applied",vNext:"GET /api/placements/jobs/{jobId}/bulk-add",method:"GET",status:200,
  note:"Active college learner candidates; eligibility and application status rechecked before addition"},
 {legacy:"POST /tpo/drives/{jobId}/applicants/remind-not-applied",vNext:"POST /api/placements/tpo/jobs/{jobId}/remind-not-applied",method:"POST",status:200,
  note:"Scoped reasoned reminder; current endpoint requires validated body"},
 {legacy:"POST /tpo/drives/{jobId}/applicants/apply-on-behalf/{learnerId}",vNext:"POST /api/placements/jobs/{jobId}/bulk-add",method:"POST",status:200,
  note:"Use {roleOptionId,membershipIds:[UUID]}; unlike old 201 this returns per-learner outcome counts"},
 {legacy:"POST /tpo/drives/{jobId}/applicants/add-students",vNext:"POST /api/placements/jobs/{jobId}/bulk-add",method:"POST",status:200,
  note:"Old learnerIds are now membershipIds and includeIneligible boolean becomes reasoned includeIneligible"},
 {legacy:"POST /tpo/drives/{jobId}/applicants/bulk-move",vNext:"POST /api/placements/tpo/bulk-actions/preview + confirm",method:"POST",status:200,
  note:"Use UUID application IDs, revision-backed preview token and guarded confirmation"},
 {legacy:"POST /tpo/drives/{jobId}/applicants/bulk-reject",vNext:"POST /api/placements/tpo/bulk-actions/preview + confirm",method:"POST",status:200,
  note:"Reason and selected applications validated by the guarded bulk-action workflow"},
 {legacy:"POST /tpo/drives/{jobId}/applicants/undo/{undoGroupId}",vNext:"POST /api/placements/tpo/bulk-actions/undo",method:"POST",status:200,
  note:"Uses stored bulk-run identifiers; conflicts respond 409 after notified/reconciled changes"},
] as const;
