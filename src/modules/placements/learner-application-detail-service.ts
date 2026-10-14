import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationStatusHistory,
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

  return {
    applicationId: application.applicationId,
    roleTitle: application.roleTitle,
    companyName: application.companyName,
    currentStatus: application.applicationStatus,
    // Actor IDs and free-text internal history reasons are not selected.
    events: learnerApplicationHistoryTimeline(rows),
  };
}

export async function getOwnLearnerApplicationCompany(
  context: RequestContext,
  rawApplicationId: string,
) {
  const application = await loadOwnedApplication(context, rawApplicationId);
  if (!application) return null;

  return {
    applicationId: application.applicationId,
    ...learnerCompanyPreview({
      companyName: application.companyName,
      companyStatus: application.companyStatus,
      websiteUrl: application.companyWebsiteUrl,
      roleTitle: application.roleTitle,
      driveTitle: application.jobTitle,
    }),
  };
}
