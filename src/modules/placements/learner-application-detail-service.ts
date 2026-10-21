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
  const applicationId = placementApplicationIdSchema.parse(rawApplicationId);
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
        eq(placementApplications.id, applicationId),
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

  const rows = await getDb()
    .select({
      id: placementApplicationStatusHistory.id,
      fromStatus: placementApplicationStatusHistory.fromStatus,
      toStatus: placementApplicationStatusHistory.toStatus,
      occurredAt: placementApplicationStatusHistory.createdAt,
    })
    .from(placementApplicationStatusHistory)
    .where(
      eq(
        placementApplicationStatusHistory.applicationId,
        application.applicationId,
      ),
    )
    .orderBy(
      asc(placementApplicationStatusHistory.createdAt),
      asc(placementApplicationStatusHistory.id),
    );

  // Some migrated applications have no historical status events. Recover
  // their original persisted submission, without inventing round decisions.
  const initialAt = application.firstAppliedAt ?? application.submittedAt;
  const synthetic: {id:string;fromStatus:string|null;toStatus:string;occurredAt:Date}[] =
    rows.length === 0 ? [{
      id: application.applicationId + ":initial",
      fromStatus: null,
      toStatus: "SUBMITTED",
      occurredAt: initialAt,
    }] : [];
  if (rows.length === 0 && application.applicationStatus !== "SUBMITTED" &&
      application.statusUpdatedAt &&
      application.statusUpdatedAt.getTime() >= initialAt.getTime()) {
    synthetic.push({
      id: application.applicationId + ":current",
      fromStatus: "SUBMITTED",
      toStatus: application.applicationStatus,
      occurredAt: application.statusUpdatedAt,
    });
  }
  return {
    applicationId: application.applicationId,
    publicRef: application.publicRef,
    // Employer/ATS identification uses the immutable, unique publicRef.
    // Numeric legacy IDs and routing UUIDs are never applicant references.
    externalAtsReference: application.publicRef,
    legacyImportApplicationId: application.legacyApplicationId,
    roleTitle: application.roleTitle,
    companyName: application.companyName,
    currentStatus: application.applicationStatus,
    // Actor IDs and free-text internal history reasons are not selected.
    events: learnerApplicationHistoryTimeline(rows.length ? rows : synthetic),
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
      return limited.length===0||limited.includes(application.applicationId);
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
