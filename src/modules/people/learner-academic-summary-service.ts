import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  cohorts,
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  programs,
  users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { buildOwnLearnerAcademicSummary } from "./learner-academic-summary-model";
import { getOwnAcademicEvidence } from "@/modules/placements/eligibility-service";

/**
 * Profile academic identity comes from a live enrollment, never client profile
 * JSON or a caller-supplied membership ID. A missing enrollment stays unknown.
 */
export async function getOwnLearnerAcademicSummary(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "LEARNER") ||
      membership.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("academics.read");
  }
  const membershipId = z.string().uuid().parse(membership.id);
  requirePermission(context, "academics.read", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  });

  const db = getDb();
  const [owner] = await db.select({
    memberId: collegeMemberships.id,
    userId: collegeMemberships.userId,
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
    accountStatus: users.platformStatus,
    displayName: users.displayName,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(eq(collegeMemberships.id, membershipId))
    .limit(1);

  if (!owner || owner.userId !== context.user.id ||
      owner.collegeId !== membership.collegeId ||
      owner.status !== "ACTIVE" || owner.accountStatus !== "ACTIVE") {
    throw new AuthorizationError("academics.read");
  }

  const enrolled = await db.select({
    programName: programs.name,
    programCode: programs.code,
    cohortName: cohorts.name,
    departmentName: departments.name,
    enrolledCollegeId: departments.collegeId,
  }).from(learnerProgramEnrollments)
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(cohorts, and(
      eq(cohorts.id, learnerProgramEnrollments.cohortId),
      eq(cohorts.programId, learnerProgramEnrollments.programId),
    ))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, membershipId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    ))
    .limit(2);

  // Multiple active memberships in one program would make current enrollment
  // ambiguous: fail closed rather than showing a potentially wrong program.
  if (enrolled.length > 1 ||
      (enrolled[0] && enrolled[0].enrolledCollegeId !== membership.collegeId)) {
    throw new AuthorizationError("academics.read");
  }
  const current = enrolled[0] ?? null;
  // Scores belong to placement evidence, not enrollment. The placement service
  // enforces persisted VERIFIED/SELF provenance; failure to read that optional
  // evidence must never erase the learner\'s authenticated college enrollment.
  const evidence = await getOwnAcademicEvidence(context).catch(() => null);
  return {
    ...buildOwnLearnerAcademicSummary({
    displayName: owner.displayName,
    programName: current?.programName ?? null,
    programCode: current?.programCode ?? null,
    cohortName: current?.cohortName ?? null,
    departmentName: current?.departmentName ?? null,
    }),
    placementEvidence: evidence ? {
      source: evidence.source,
      cgpa: evidence.cgpa,
      undergraduatePercentage: evidence.undergraduatePercentage,
    } : null,
  };
}
