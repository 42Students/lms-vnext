import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings,
  placementJobRoleOptions, placementOffers, placementJoiningOutcomes, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { getRecruiterPlacementWorkspace } from "./recruiter-workspace-service";
import { hrApplicantFilterSchema, HR_APPLICANT_PAGE_SIZE, projectSharedApplicants, hrApplicantPageBounds } from "./hr-job-applicants-model";

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
  const stageCondition=filters.stage === "ALL"
    ? where
    : and(where,eq(placementApplications.status,filters.stage === "SHORTLISTED" ? "SUBMITTED" : "WITHDRAWN"));
  const [counts,applications, offers] = await Promise.all([
    db.select({
      total: sql<number>`count(*)::integer`,
      active: sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED')::integer`,
      withdrawn: sql<number>`count(*) filter (where ${placementApplications.status} = 'WITHDRAWN')::integer`,
    }).from(placementApplications)
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(where),
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
      .where(stageCondition)
      .orderBy(desc(placementApplications.submittedAt), desc(placementApplications.id))
      .limit(HR_APPLICANT_PAGE_SIZE)
      .offset((filters.page - 1) * HR_APPLICANT_PAGE_SIZE),
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
  const totals = counts[0];
  const applicantCounts = {
    all: Number(totals?.total ?? 0),
    shortlisted: Number(totals?.active ?? 0),
    withdrawn: Number(totals?.withdrawn ?? 0),
  };
  const projected = projectSharedApplicants(applications, filters.stage);
  const selectedTotal = filters.stage === "SHORTLISTED" ? applicantCounts.shortlisted
    : filters.stage === "WITHDRAWN" ? applicantCounts.withdrawn : applicantCounts.all;
  return {
    workspace, filters,
    applicants: { rows: projected.rows, counts: applicantCounts },
    applicantsPage: hrApplicantPageBounds(filters.page, selectedTotal),
    applicantsTruncated: false,
    offers: offers.slice(0, 200), offersTruncated: offers.length > 200,
  };
}
