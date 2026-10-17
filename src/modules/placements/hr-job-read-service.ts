import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings,
  placementJobRoleOptions, placementOffers, placementJoiningOutcomes, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { getRecruiterPlacementWorkspace } from "./recruiter-workspace-service";
import { hrApplicantFilterSchema, HR_APPLICANT_PAGE_SIZE, projectSharedApplicants, hrApplicantPageBounds, HR_OFFER_PAGE_SIZE, hrOfferPageBounds } from "./hr-job-applicants-model";

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
  const offerCondition=filters.offerState === "ALL"
    ? where
    : and(where,eq(placementOffers.status,filters.offerState));
  const [counts,applications, offerCounts,offers] = await Promise.all([
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
      total: sql<number>`count(*)::integer`,
      distinctOffered: sql<number>`count(distinct ${placementOffers.applicationId})::integer`,
      distinctHired: sql<number>`count(distinct ${placementOffers.applicationId})
        filter (where ${placementJoiningOutcomes.status} = 'JOINED')::integer`,
      issued: sql<number>`count(*) filter (where ${placementOffers.status}='ISSUED')::integer`,
      accepted: sql<number>`count(*) filter (where ${placementOffers.status}='ACCEPTED')::integer`,
      declined: sql<number>`count(*) filter (where ${placementOffers.status}='DECLINED')::integer`,
      withdrawn: sql<number>`count(*) filter (where ${placementOffers.status}='WITHDRAWN')::integer`,
      selected: sql<number>`count(*) filter (where ${placementOffers.status}='SELECTED')::integer`,
      verification: sql<number>`count(*) filter (where ${placementOffers.status}='PENDING_VERIFICATION')::integer`,
      expired: sql<number>`count(*) filter (where ${placementOffers.status}='EXPIRED')::integer`,
      revoked: sql<number>`count(*) filter (where ${placementOffers.status}='REVOKED')::integer`,
      joined: sql<number>`count(*) filter (where ${placementOffers.status}='ACCEPTED'
        and ${placementJoiningOutcomes.status}='JOINED')::integer`,
      awaitingReply: sql<number>`count(*) filter (where ${placementOffers.status}='ISSUED'
        and (${placementOffers.expiresAt} is null or ${placementOffers.expiresAt} >= now()))::integer`,
      overdue: sql<number>`count(*) filter (where ${placementOffers.status}='ISSUED'
        and ${placementOffers.expiresAt} < now())::integer`,
    }).from(placementOffers)
      .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
      .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(where),
    db.select({
      id: placementOffers.id, kind: placementOffers.kind, status: placementOffers.status, role: placementOffers.roleTitle,
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
      .where(offerCondition)
      .orderBy(desc(placementOffers.issuedAt), desc(placementOffers.id))
      .limit(HR_OFFER_PAGE_SIZE).offset((filters.offerPage - 1) * HR_OFFER_PAGE_SIZE),
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
    offerSummary: {
      recorded: Number(offerCounts[0]?.total ?? 0),
      distinctOffered:Number(offerCounts[0]?.distinctOffered ?? 0),
      distinctHired:Number(offerCounts[0]?.distinctHired ?? 0),
      issued: Number(offerCounts[0]?.issued ?? 0),
      accepted: Number(offerCounts[0]?.accepted ?? 0),
      declined: Number(offerCounts[0]?.declined ?? 0),
      joined: Number(offerCounts[0]?.joined ?? 0),
      awaitingReply: Number(offerCounts[0]?.awaitingReply ?? 0),
      overdue: Number(offerCounts[0]?.overdue ?? 0),
    },
    offers,
    offersPage: hrOfferPageBounds(filters.offerPage,
      filters.offerState === "ISSUED" ? Number(offerCounts[0]?.issued ?? 0) :
      filters.offerState === "ACCEPTED" ? Number(offerCounts[0]?.accepted ?? 0) :
      filters.offerState === "DECLINED" ? Number(offerCounts[0]?.declined ?? 0) :
      filters.offerState === "WITHDRAWN" ? Number(offerCounts[0]?.withdrawn ?? 0) :
      filters.offerState === "SELECTED" ? Number(offerCounts[0]?.selected ?? 0) :
      filters.offerState === "PENDING_VERIFICATION" ? Number(offerCounts[0]?.verification ?? 0) :
      filters.offerState === "EXPIRED" ? Number(offerCounts[0]?.expired ?? 0) :
      filters.offerState === "REVOKED" ? Number(offerCounts[0]?.revoked ?? 0) :
      Number(offerCounts[0]?.total ?? 0)),
    offersTotal: Number(offerCounts[0]?.total ?? 0),
  };
}
