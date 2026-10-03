import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  membershipRoles,
  organizations,
  learnerProgramEnrollments,
  programs,
  cohorts,
  departments,
  sectionEnrollments,
  sections,
  sectionFacultyAssignments,
  sectionScheduleEvents,
} from "@/db/schema";
import type { MembershipRole } from "@/modules/identity/constants";
import { AcademicsServiceError } from "./errors";

export async function loadAcademicsMembership(
  membershipId: string,
) {
  const db = getDb();

  const [membership] = await db
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      organizationId: colleges.organizationId,
      status: collegeMemberships.status,
    })
    .from(collegeMemberships)
    .innerJoin(
      colleges,
      eq(colleges.id, collegeMemberships.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(collegeMemberships.id, membershipId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new AcademicsServiceError(
      "MEMBERSHIP_NOT_FOUND",
    );
  }

  const roleRows = await db
    .select({ role: membershipRoles.role })
    .from(membershipRoles)
    .where(
      eq(
        membershipRoles.membershipId,
        membershipId,
      ),
    );

  return {
    ...membership,
    roles: roleRows.map(
      (row) => row.role,
    ) as MembershipRole[],
  };
}

export function requireActiveAcademicMembership(
  membership: Awaited<
    ReturnType<typeof loadAcademicsMembership>
  >,
) {
  if (membership.status !== "ACTIVE") {
    throw new AcademicsServiceError(
      "MEMBERSHIP_NOT_ACTIVE",
    );
  }
}

export function requireAcademicRole(
  membership: Awaited<
    ReturnType<typeof loadAcademicsMembership>
  >,
  role: "LEARNER" | "FACULTY",
) {
  requireActiveAcademicMembership(membership);

  if (!membership.roles.includes(role)) {
    throw new AcademicsServiceError(
      role === "LEARNER"
        ? "LEARNER_ROLE_REQUIRED"
        : "FACULTY_ROLE_REQUIRED",
    );
  }
}

export async function loadLearnerEnrollmentScope(
  enrollmentId: string,
) {
  const db = getDb();
  const [row] = await db
    .select({
      id: learnerProgramEnrollments.id,
      membershipId:
        learnerProgramEnrollments.membershipId,
      programId:
        learnerProgramEnrollments.programId,
      cohortId:
        learnerProgramEnrollments.cohortId,
      status: learnerProgramEnrollments.status,
      membershipCollegeId:
        collegeMemberships.collegeId,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
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
      programs,
      eq(
        programs.id,
        learnerProgramEnrollments.programId,
      ),
    )
    .innerJoin(
      cohorts,
      eq(
        cohorts.id,
        learnerProgramEnrollments.cohortId,
      ),
    )
    .innerJoin(
      departments,
      eq(departments.id, programs.departmentId),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(
          learnerProgramEnrollments.id,
          enrollmentId,
        ),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AcademicsServiceError(
      "LEARNER_ENROLLMENT_NOT_FOUND",
    );
  }

  if (row.membershipCollegeId !== row.collegeId) {
    throw new AcademicsServiceError(
      "ENROLLMENT_COLLEGE_MISMATCH",
    );
  }

  return row;
}

export async function loadSectionEnrollmentScope(
  sectionEnrollmentId: string,
) {
  const db = getDb();
  const [row] = await db
    .select({
      id: sectionEnrollments.id,
      learnerEnrollmentId:
        sectionEnrollments.learnerEnrollmentId,
      sectionId: sectionEnrollments.sectionId,
      academicPeriodId:
        sectionEnrollments.academicPeriodId,
      status: sectionEnrollments.status,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
    })
    .from(sectionEnrollments)
    .innerJoin(
      learnerProgramEnrollments,
      eq(
        learnerProgramEnrollments.id,
        sectionEnrollments.learnerEnrollmentId,
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
      departments,
      eq(departments.id, programs.departmentId),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(sectionEnrollments.id, sectionEnrollmentId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AcademicsServiceError(
      "SECTION_ENROLLMENT_NOT_FOUND",
    );
  }

  return row;
}

export async function loadFacultyAssignmentScope(
  assignmentId: string,
) {
  const db = getDb();
  const [row] = await db
    .select({
      id: sectionFacultyAssignments.id,
      sectionId:
        sectionFacultyAssignments.sectionId,
      membershipId:
        sectionFacultyAssignments.membershipId,
      role: sectionFacultyAssignments.role,
      endedAt: sectionFacultyAssignments.endedAt,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
    })
    .from(sectionFacultyAssignments)
    .innerJoin(
      sections,
      eq(
        sections.id,
        sectionFacultyAssignments.sectionId,
      ),
    )
    .innerJoin(
      cohorts,
      eq(cohorts.id, sections.cohortId),
    )
    .innerJoin(
      programs,
      eq(programs.id, cohorts.programId),
    )
    .innerJoin(
      departments,
      eq(departments.id, programs.departmentId),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(
          sectionFacultyAssignments.id,
          assignmentId,
        ),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AcademicsServiceError(
      "FACULTY_ASSIGNMENT_NOT_FOUND",
    );
  }

  return row;
}

export async function loadScheduleEventScope(
  eventId: string,
) {
  const db = getDb();
  const [row] = await db
    .select({
      id: sectionScheduleEvents.id,
      sectionId: sectionScheduleEvents.sectionId,
      facultyMembershipId:
        sectionScheduleEvents.facultyMembershipId,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      status: sectionScheduleEvents.status,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
      academicPeriodId: sections.academicPeriodId,
    })
    .from(sectionScheduleEvents)
    .innerJoin(
      sections,
      eq(
        sections.id,
        sectionScheduleEvents.sectionId,
      ),
    )
    .innerJoin(
      cohorts,
      eq(cohorts.id, sections.cohortId),
    )
    .innerJoin(
      programs,
      eq(programs.id, cohorts.programId),
    )
    .innerJoin(
      departments,
      eq(departments.id, programs.departmentId),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(sectionScheduleEvents.id, eventId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AcademicsServiceError(
      "SCHEDULE_EVENT_NOT_FOUND",
    );
  }

  return row;
}
