import "server-only";

import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationStatusHistory,
  placementApplicationScreenings,
  placementCompanyApplicantShares,
  placementCompanyShareSelections,
  users,
  placementCompanies,
  placementCompanyRelationships,
  placementJobRoleOptions,
  placementJobs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { placementApplicationIdSchema } from "./validation";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {
  placementCollegeApplicationStages,
  placementCollegeApplicationStageHistory,
} from "@/db/schema/placement-college-application-stages";
import {
  learnerApplicationHistoryTimeline,
  learnerCompanyPreview,
} from "./learner-application-detail-model";

/**
 * Resolve the parent application only through the authenticated learner's
 * persisted active membership. Never accept a membership/college/company ID
 * from the browser. The existing placement participation gate independently
 * verifies the current persisted learner identity and paid-module access.
 */
async function loadOwnedApplication(
  context: RequestContext,
  rawApplicationId: string,
) {
  // Imported legacy links may contain an integer application ID. Resolve that
  // only inside the learner-owned college/membership predicate below, never
  // as a globally readable lookup or another learner's authority.
  const parsedUuid = placementApplicationIdSchema.safeParse(rawApplicationId);
  const legacyApplicationId =
    !parsedUuid.success && /^[1-9][0-9]{0,9}$/.test(rawApplicationId) &&
      Number(rawApplicationId) <= 2147483647
      ? Number(rawApplicationId) : null;
  if (!parsedUuid.success && legacyApplicationId === null) {
    placementApplicationIdSchema.parse(rawApplicationId);
  }
  const applicationFilter=parsedUuid.success
    ? eq(placementApplications.id,parsedUuid.data)
    : eq(placementApplications.legacyApplicationId,legacyApplicationId!);
  const membership = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", {
    collegeId: membership.collegeId,
  });

  const [row] = await getDb()
    .select({
      applicationId: placementApplications.id,
      publicRef: placementApplications.publicRef,
      legacyApplicationId: placementApplications.legacyApplicationId,
      submittedAt: placementApplications.submittedAt,
      firstAppliedAt: placementApplications.firstAppliedAt,
      statusUpdatedAt: placementApplications.statusUpdatedAt,
      jobId: placementApplications.jobId,
      applicationStatus: placementApplications.status,
      jobTitle: placementJobs.title,
      roleTitle: placementJobRoleOptions.title,
      companyName: placementCompanies.name,
      companyStatus: placementCompanies.status,
      companyWebsiteUrl: placementCompanies.websiteUrl,
    })
    .from(placementApplications)
    .innerJoin(
      collegeMemberships,
      eq(collegeMemberships.id, placementApplications.membershipId),
    )
    .innerJoin(
      placementJobs,
      eq(placementJobs.id, placementApplications.jobId),
    )
    .innerJoin(
      placementJobRoleOptions,
      and(
        eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
        eq(placementJobRoleOptions.jobId, placementJobs.id),
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      and(
        eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
        eq(placementCompanyRelationships.collegeId, placementJobs.collegeId),
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(
      and(
        applicationFilter,
        eq(placementApplications.membershipId, membership.id),
        eq(collegeMemberships.userId, context.user.id),
        eq(collegeMemberships.collegeId, membership.collegeId),
        eq(placementJobs.collegeId, membership.collegeId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getOwnLearnerApplicationHistory(
  context: RequestContext,
  rawApplicationId: string,
) {
  const application = await loadOwnedApplication(context, rawApplicationId);
  if (!application) return null;

  // Current application status and staff-owned pipeline stages have separate
  // immutable histories in vNext. Combine their safe status/timestamps only:
  // never expose actor IDs, internal reason or private screening feedback.
  const [rows,stageRows] = await Promise.all([
    getDb().select({
      id:placementApplicationStatusHistory.id,
      fromStatus:placementApplicationStatusHistory.fromStatus,
      toStatus:placementApplicationStatusHistory.toStatus,
      occurredAt:placementApplicationStatusHistory.createdAt,
    }).from(placementApplicationStatusHistory)
     .where(eq(placementApplicationStatusHistory.applicationId,application.applicationId))
     .orderBy(asc(placementApplicationStatusHistory.createdAt),asc(placementApplicationStatusHistory.id)),
    getDb().select({
      id:placementCollegeApplicationStageHistory.id,
      fromStatus:placementCollegeApplicationStageHistory.fromStage,
      toStatus:placementCollegeApplicationStageHistory.toStage,
      occurredAt:placementCollegeApplicationStageHistory.movedAt,
    }).from(placementCollegeApplicationStageHistory)
     .innerJoin(placementCollegeApplicationStages,
       eq(placementCollegeApplicationStages.id,placementCollegeApplicationStageHistory.stageId))
     .where(eq(placementCollegeApplicationStages.applicationId,application.applicationId))
     .orderBy(asc(placementCollegeApplicationStageHistory.movedAt),asc(placementCollegeApplicationStageHistory.id)),
  ]);

  // Imported and pre-history applications still need an accessible initial
  // status. This synthetic learner-facing event is read-only: no database
  // status write, no guessed round outcomes, no internal actor or free-text
  // staff reason. Chronology is changed-at ascending, with UUID as tie-breaker.
  // The learner feed may have thousands of historic transitions: this reader
  // intentionally returns the full scoped history rather than hiding old rows
  // behind an arbitrary LIMIT, matching legacy service behavior.
  // Legacy's pre-history fallback records the observed current status once,
  // at the original application time; it does not invent an intermediate
  // SUBMITTED transition (which could misrepresent a withdrawn import).
  const initialAt = application.firstAppliedAt ?? application.submittedAt ??
    application.statusUpdatedAt ?? new Date();
  const synthetic: {id:string;fromStatus:string|null;toStatus:string;occurredAt:Date}[] =
    rows.length === 0 ? [{
      id: application.applicationId + ":initial",
      fromStatus: null,
      toStatus: application.applicationStatus,
      occurredAt: initialAt,
    }] : [];
  return {
    applicationId: application.applicationId,
    publicRef: application.publicRef,
    // Employer/ATS identification uses the immutable, unique publicRef.
    // Numeric legacy IDs and routing UUIDs are never applicant references.
    externalAtsReference: application.publicRef,
    legacyImportApplicationId: application.legacyApplicationId,
    // Render as AXXXXXXXXXX for legacy-imported references without exposing
    // its internal routing UUID. Native vNext references remain unguessable.
    legacyDisplayReference: application.legacyApplicationId===null?null:
      "A"+String(application.legacyApplicationId).padStart(10,"0"),
    roleTitle: application.roleTitle,
    companyName: application.companyName,
    currentStatus: application.applicationStatus,
    // Actor IDs and free-text internal history reasons are not selected.
    events: learnerApplicationHistoryTimeline([
      ...(rows.length?rows:synthetic),...stageRows,
    ]),
  };
}

export async function getOwnLearnerApplicationCompany(
  context: RequestContext,
  rawApplicationId: string,
) {
  const application = await loadOwnedApplication(context, rawApplicationId);
  if (!application) return null;

  // Mirror the currently registered company-share projection: only shortlisted
  // submitted applicants may appear, and selected-applicant filters apply.
  // Share tokens, other learners and employer activity are never returned.
  const [[screening],[principal],activeShares]=await Promise.all([
    getDb().select({status:placementApplicationScreenings.status})
      .from(placementApplicationScreenings)
      .where(eq(placementApplicationScreenings.applicationId,application.applicationId)).limit(1),
    getDb().select({displayName:users.displayName,email:users.email})
      .from(users).where(eq(users.id,context.user.id)).limit(1),
    getDb().select({id:placementCompanyApplicantShares.id})
      .from(placementCompanyApplicantShares).where(and(
        eq(placementCompanyApplicantShares.jobId,application.jobId),
        eq(placementCompanyApplicantShares.collegeId,context.membership!.collegeId),
        isNull(placementCompanyApplicantShares.revokedAt),
        gt(placementCompanyApplicantShares.expiresAt,new Date()),
      )),
  ]);
  const selected=activeShares.length?await getDb().select({
    shareId:placementCompanyShareSelections.shareId,
    applicationId:placementCompanyShareSelections.applicationId,
  }).from(placementCompanyShareSelections).where(
    inArray(placementCompanyShareSelections.shareId,activeShares.map(s=>s.id)),
  ):[];
  const sharedIds=new Map<string,string[]>();
  for(const row of selected){
    const list=sharedIds.get(row.shareId)??[];
    list.push(row.applicationId);
    sharedIds.set(row.shareId,list);
  }
  const currentlyShared=application.applicationStatus==="SUBMITTED" &&
    screening?.status==="SHORTLISTED" && activeShares.some(share=>{
      const limited=sharedIds.get(share.id)??[];
      return limited.includes(application.applicationId);
    });
  return {
    applicationId: application.applicationId,
    publicRef: application.publicRef,
    externalAtsReference: application.publicRef,
    companySharePreview:{
      currentlyShared,
      fields:["Applicant reference","Learner","Email"] as const,
      // Never present the private routing UUID as an employer-facing ATS ref.
      applicationId:application.publicRef,
      applicantReference:application.publicRef,
      learnerName:principal?.displayName??"Unnamed learner",
      email:principal?.email??null,
    },
    ...learnerCompanyPreview({
      companyName: application.companyName,
      companyStatus: application.companyStatus,
      websiteUrl: application.companyWebsiteUrl,
      roleTitle: application.roleTitle,
      driveTitle: application.jobTitle,
    }),
  };
}

/** Keep unauthorized/non-applicant preview copy independent of internal IDs. */
export const learnerCompanyPreviewNonApplicantMessage =
  "Apply to this drive to see this preview";
