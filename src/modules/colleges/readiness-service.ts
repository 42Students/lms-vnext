import "server-only";

import {
  and,
  count,
  countDistinct,
  eq,
  isNull,
  ne,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {
  attendancePolicies,
  cohorts,
  collegeMemberships,
  colleges,
  departments,
  learnerProgramEnrollments,
  lectureHalls,
  membershipRoles,
  placementSeasons,
  programs,
  tenantDomains,
  users,
} from "@/db/schema";
import {
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import type {
  MembershipRole,
} from "@/modules/identity/constants";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";

import {
  collegeIdSchema,
} from "./validation";
import {
  evaluateCollegeReadiness,
  type CollegeReadinessFacts,
} from "./readiness-model";

function isMissingRelation(
  error: unknown,
): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 6; depth += 1) {
    if (
      !current ||
      typeof current !== "object"
    ) {
      break;
    }

    if (
      "code" in current &&
      current.code === "42P01"
    ) {
      return true;
    }

    current =
      "cause" in current
        ? current.cause
        : null;
  }

  return false;
}

/**
 * Missing registered relations are UNKNOWN rather
 * than PASS or an invented zero count.
 *
 * Do not hide connection, permission, syntax or
 * other runtime errors: those still reach the route
 * error boundary.
 */
async function safeCount(
  query: Promise<{
    total: number;
  }[]>,
): Promise<number | null> {
  try {
    const rows = await query;
    return rows[0]?.total ?? 0;
  } catch (error) {
    if (isMissingRelation(error)) {
      return null;
    }
    throw error;
  }
}

export async function getSuperAdminCollegeReadiness(
  context: RequestContext,
  collegeIdInput: string,
) {
  if (!isSuperAdmin(context)) {
    throw new AuthorizationError("college.read");
  }

  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
      status: colleges.status,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  if (!college) {
    return null;
  }

  // Same centrally defined Super Admin resource
  // permission and selected-scope fence as the
  // existing Colleges service.
  requirePermission(context, "college.read", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  function roleCount(
    role: MembershipRole,
  ) {
    return safeCount(
      db
        .select({
          total: countDistinct(
            collegeMemberships.id,
          ),
        })
        .from(collegeMemberships)
        .innerJoin(
          membershipRoles,
          eq(
            membershipRoles.membershipId,
            collegeMemberships.id,
          ),
        )
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .where(
          and(
            eq(
              collegeMemberships.collegeId,
              college.id,
            ),
            eq(
              collegeMemberships.status,
              "ACTIVE",
            ),
            eq(
              users.platformStatus,
              "ACTIVE",
            ),
            eq(membershipRoles.role, role),
          ),
        ),
    );
  }

  // Every query is tied directly or transitively to
  // the stored college ID. Cross-college memberships,
  // programs, cohorts and enrollments cannot count.
  const [
    adminMemberships,
    activeDepartments,
    activePrograms,
    availableCohorts,
    enrolledLearners,
    facultyMemberships,
    tpoMemberships,
    activePlacementSeasons,
    verifiedPrimaryDomains,
    activeLectureHalls,
    storedAttendancePolicies,
  ] = await Promise.all([
    roleCount("COLLEGE_ADMIN"),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(departments)
        .where(
          and(
            eq(departments.collegeId, college.id),
            isNull(departments.archivedAt),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(programs)
        .innerJoin(
          departments,
          eq(
            departments.id,
            programs.departmentId,
          ),
        )
        .where(
          and(
            eq(departments.collegeId, college.id),
            isNull(departments.archivedAt),
            eq(programs.status, "ACTIVE"),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(cohorts)
        .innerJoin(
          programs,
          eq(programs.id, cohorts.programId),
        )
        .innerJoin(
          departments,
          eq(
            departments.id,
            programs.departmentId,
          ),
        )
        .where(
          and(
            eq(departments.collegeId, college.id),
            isNull(departments.archivedAt),
            eq(programs.status, "ACTIVE"),
            ne(cohorts.status, "ARCHIVED"),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: countDistinct(
            collegeMemberships.id,
          ),
        })
        .from(learnerProgramEnrollments)
        .innerJoin(
          collegeMemberships,
          eq(
            collegeMemberships.id,
            learnerProgramEnrollments.membershipId,
          ),
        )
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .innerJoin(
          membershipRoles,
          eq(
            membershipRoles.membershipId,
            collegeMemberships.id,
          ),
        )
        .innerJoin(
          programs,
          eq(
            programs.id,
            learnerProgramEnrollments.programId,
          ),
        )
        .innerJoin(
          cohorts,
          and(
            eq(
              cohorts.id,
              learnerProgramEnrollments.cohortId,
            ),
            eq(
              cohorts.programId,
              programs.id,
            ),
          ),
        )
        .innerJoin(
          departments,
          eq(
            departments.id,
            programs.departmentId,
          ),
        )
        .where(
          and(
            eq(
              collegeMemberships.collegeId,
              college.id,
            ),
            eq(
              collegeMemberships.status,
              "ACTIVE",
            ),
            eq(
              users.platformStatus,
              "ACTIVE",
            ),
            eq(membershipRoles.role, "LEARNER"),
            eq(
              learnerProgramEnrollments.status,
              "ACTIVE",
            ),
            eq(
              departments.collegeId,
              college.id,
            ),
            isNull(departments.archivedAt),
            eq(programs.status, "ACTIVE"),
            ne(cohorts.status, "ARCHIVED"),
          ),
        ),
    ),

    roleCount("FACULTY"),
    roleCount("TPO"),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(placementSeasons)
        .where(
          and(
            eq(
              placementSeasons.collegeId,
              college.id,
            ),
            eq(
              placementSeasons.status,
              "ACTIVE",
            ),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(tenantDomains)
        .where(
          and(
            eq(
              tenantDomains.collegeId,
              college.id,
            ),
            eq(
              tenantDomains.isVerified,
              true,
            ),
            eq(
              tenantDomains.isPrimary,
              true,
            ),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(lectureHalls)
        .where(
          and(
            eq(
              lectureHalls.collegeId,
              college.id,
            ),
            eq(
              lectureHalls.status,
              "ACTIVE",
            ),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(attendancePolicies)
        .where(
          eq(
            attendancePolicies.collegeId,
            college.id,
          ),
        ),
    ),
  ]);

  const facts: CollegeReadinessFacts = {
    collegeStatus: college.status,
    adminMemberships,
    departments: activeDepartments,
    programs: activePrograms,
    cohorts: availableCohorts,
    enrolledLearners,
    facultyMemberships,
    tpoMemberships,
    activePlacementSeasons,
    verifiedPrimaryDomains,
  };

  // Re-authorize from persisted active user/system-role rows before exposing
  // tenant counts. A previously valid Super Admin request may finish after
  // the officer's role has been revoked while independent counts are running.
  await db.transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"college.read",{
      collegeId:college.id,organizationId:college.organizationId,
    });
  });

  return {
    college,
    evaluation:
      evaluateCollegeReadiness(facts),
    supplemental: {
      activeLectureHalls,
      attendancePolicyRecord:
        storedAttendancePolicies === null
          ? null
          : storedAttendancePolicies > 0,
    },
  };
}
