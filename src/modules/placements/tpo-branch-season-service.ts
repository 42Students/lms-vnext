import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  placementApplications,
  placementJobs,
  placementOffers,
  placementSeasons,
  programs,
} from "@/db/schema";
import { placementBatchRegistrations } from "@/db/schema/placement-registration";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { placementTableExists } from "./staged-tables";
import { requirePlacementManageScope } from "./scope";
import {
  projectTpoBranchSeason,
  tpoBranchSeasonQuerySchema,
} from "./tpo-branch-season-model";

export async function getTpoBranchSeasonDashboard(
  context: RequestContext,
  raw: unknown,
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const input = tpoBranchSeasonQuerySchema.parse(raw);
  await requirePlacementManageScope(context, collegeId);
  const db = getDb();
  const seasons = await db.select({
    id: placementSeasons.id,
    name: placementSeasons.name,
    status: placementSeasons.status,
    startDate: placementSeasons.startDate,
  }).from(placementSeasons)
    .where(eq(placementSeasons.collegeId, collegeId))
    .orderBy(desc(placementSeasons.startDate));
  const season = input.seasonId
    ? seasons.find((row) => row.id === input.seasonId)
    : seasons.find((row) => row.status === "ACTIVE") ?? seasons[0];
  if (input.seasonId && !season) {
    throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_FOUND");
  }
  if (!season) return {
    seasons, season: null, rows: [], registrationAvailable: false,
    totalApplicants: 0, totalAcceptedLearners: 0,
  };
  const enrollmentRows = await db.select({
    membershipId: learnerProgramEnrollments.membershipId,
    cohortId: learnerProgramEnrollments.cohortId,
    departmentId: departments.id,
    departmentName: departments.name,
  }).from(learnerProgramEnrollments)
    .innerJoin(collegeMemberships, eq(
      collegeMemberships.id, learnerProgramEnrollments.membershipId,
    ))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      eq(collegeMemberships.collegeId, collegeId),
      eq(departments.collegeId, collegeId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    ));
  const applications = await db.select({
    id: placementApplications.id,
    membershipId: placementApplications.membershipId,
  }).from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .innerJoin(collegeMemberships, eq(
      collegeMemberships.id, placementApplications.membershipId,
    ))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      eq(placementJobs.seasonId, season.id),
      eq(collegeMemberships.collegeId, collegeId),
    ));
  const offers = await db.select({
    id: placementOffers.id,
    applicationId: placementOffers.applicationId,
    status: placementOffers.status,
  }).from(placementOffers)
    .innerJoin(placementApplications, eq(
      placementApplications.id, placementOffers.applicationId,
    ))
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .innerJoin(collegeMemberships, eq(
      collegeMemberships.id, placementApplications.membershipId,
    ))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      eq(placementJobs.seasonId, season.id),
      eq(collegeMemberships.collegeId, collegeId),
    ));
  const registrationAvailable = await placementTableExists("placement_batch_registrations");
  const persistedRegistrationRows = registrationAvailable
    ? await db.select({
        membershipId: placementBatchRegistrations.membershipId,
        cohortId: placementBatchRegistrations.cohortId,
        choice: placementBatchRegistrations.choice,
      }).from(placementBatchRegistrations)
        .where(eq(placementBatchRegistrations.collegeId, collegeId))
    : null;
  const cohortPairs = new Set(enrollmentRows.map((row) =>
    row.membershipId + ":" + row.cohortId));
  const registered = persistedRegistrationRows?.filter((row) =>
    row.choice === "PLACEMENTS" &&
    cohortPairs.has(row.membershipId + ":" + row.cohortId))
    .map((row) => ({ membershipId: row.membershipId })) ?? null;
  const rows = projectTpoBranchSeason(
    enrollmentRows.map((row) => ({
      membershipId: row.membershipId,
      departmentId: row.departmentId,
      departmentName: row.departmentName,
    })),
    applications, offers, registered,
  );
  return {
    seasons, season, rows, registrationAvailable,
    totalApplicants: new Set(applications.map((row) => row.membershipId)).size,
    totalAcceptedLearners: new Set(offers.filter((offer) => offer.status === "ACCEPTED")
      .map((offer) => applications.find((app) => app.id === offer.applicationId)?.membershipId)
      .filter((value): value is string => value !== undefined)).size,
  };
}
