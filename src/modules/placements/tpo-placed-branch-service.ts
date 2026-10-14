import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, departments, learnerProgramEnrollments,
  placementApplications, placementJobs, placementJoiningOutcomes,
  placementOffers, programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { getTpoSeasonPipeline } from "./tpo-season-pipeline-service";
import { projectTpoPlacedStudentsByBranch } from "./tpo-placed-branch-model";

/** TPO-only, scoped by the authenticated membership and selected persisted season. */
export async function getTpoPlacedStudentsByBranch(context: RequestContext, raw: unknown) {
  const scope = await getTpoSeasonPipeline(context, raw);
  if (!scope.season) {
    return { ...scope, ...projectTpoPlacedStudentsByBranch([], []),
      branchScopeNote: "No placement season selected. Historical results cannot be inferred." };
  }
  const collegeId = context.membership!.collegeId;
  const db = getDb();
  const [offers, enrollments] = await Promise.all([
    db.select({
      id: placementOffers.id,
      membershipId: placementApplications.membershipId,
      status: placementOffers.status,
      joiningStatus: placementJoiningOutcomes.status,
    }).from(placementOffers)
      .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
      .where(and(
        eq(placementJobs.collegeId, collegeId),
        eq(placementJobs.seasonId, scope.season.id),
        isNull(placementJobs.archivedAt),
        eq(collegeMemberships.collegeId, collegeId),
        scope.selectedJobId ? eq(placementJobs.id, scope.selectedJobId) : undefined,
      )),
    db.select({
      membershipId: learnerProgramEnrollments.membershipId,
      departmentId: departments.id,
      departmentName: departments.name,
    }).from(learnerProgramEnrollments)
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, learnerProgramEnrollments.membershipId))
      .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(eq(collegeMemberships.collegeId, collegeId),
        eq(departments.collegeId, collegeId),
        eq(learnerProgramEnrollments.status, "ACTIVE")))
      .orderBy(desc(learnerProgramEnrollments.admittedAt), learnerProgramEnrollments.membershipId),
  ]);
  return {
    ...scope, ...projectTpoPlacedStudentsByBranch(offers, enrollments),
    branchScopeNote: "Placed and joined are distinct learners with current accepted offer evidence in the selected season/drive. Joined requires a persisted JOINED outcome. Branch comes from current active academic enrollment and may differ from the branch at offer time. No registered-pool denominator is assumed.",
  };
}
