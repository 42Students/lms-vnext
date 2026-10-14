import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings,
  placementJobRoleOptions, placementOffers, placementJoiningOutcomes, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { getRecruiterPlacementWorkspace } from "./recruiter-workspace-service";
import { hrApplicantFilterSchema, projectSharedApplicants } from "./hr-job-applicants-model";

export async function getHrJobRead(context: RequestContext, rawJobId: string, rawFilters: unknown) {
  const filters = hrApplicantFilterSchema.parse(rawFilters);
  // This pre-read enforces the exact active company relationship and college grant.
  const workspace = await getRecruiterPlacementWorkspace(context, rawJobId);
  const where = and(
    eq(placementApplications.jobId, workspace.job.id),
    eq(collegeMemberships.collegeId, workspace.college.id),
    eq(collegeMemberships.status, "ACTIVE"),
    eq(users.platformStatus, "ACTIVE"),
    // The recruiter cannot inspect unshared applications or screening decisions.
    eq(placementApplicationScreenings.status, "SHORTLISTED"),
  );
  const db = getDb();
  const [applications, offers] = await Promise.all([
    db.select({
      id: placementApplications.id, name: users.displayName, email: users.email,
      role: placementJobRoleOptions.title, status: placementApplications.status,
      screening: placementApplicationScreenings.status,
      submittedAt: placementApplications.submittedAt,
    }).from(placementApplications)
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(placementJobRoleOptions, and(eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
        eq(placementJobRoleOptions.jobId, workspace.job.id)))
      .where(where).orderBy(desc(placementApplications.submittedAt), desc(placementApplications.id)).limit(201),
    db.select({
      id: placementOffers.id, status: placementOffers.status, role: placementOffers.roleTitle,
      annualCtcInr: placementOffers.annualCtcInr, joiningDate: placementOffers.joiningDate,
      issuedAt: placementOffers.issuedAt, expiresAt: placementOffers.expiresAt,
      applicationId: placementOffers.applicationId,
      joiningStatus: placementJoiningOutcomes.status,
      name: users.displayName,
    }).from(placementOffers)
      .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
      .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(where).orderBy(desc(placementOffers.issuedAt), desc(placementOffers.id)).limit(201),
  ]);
  return {
    workspace, filters,
    applicants: projectSharedApplicants(applications.slice(0, 200), filters.stage),
    applicantsTruncated: applications.length > 200,
    offers: offers.slice(0, 200), offersTruncated: offers.length > 200,
  };
}
