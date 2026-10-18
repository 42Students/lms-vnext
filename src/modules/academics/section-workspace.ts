import "server-only";

import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  collegeMemberships,
  cohorts,
  membershipRoles,
  programs,
  sections,
  users,
} from "@/db/schema";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import { AcademicsServiceError } from "./errors";
import { listLearnerProgramEnrollments } from "./enrollment-service";
import { listSectionFacultyAssignments } from "./faculty-assignment-service";
import { listSectionRoster } from "./roster-service";
import {
  listSectionScheduleCourseChoices,
  listSectionScheduleEvents,
} from "./schedule-service";
import { loadSectionScope } from "./scope";
import { sectionIdSchema } from "./validation";

async function listRoleChoices(
  collegeId: string,
  role: "LEARNER" | "FACULTY",
) {
  const db = getDb();

  return db
    .select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
    })
    .from(collegeMemberships)
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, role),
      ),
    )
    .where(
      and(
        eq(
          collegeMemberships.collegeId,
          collegeId,
        ),
        eq(
          collegeMemberships.status,
          "ACTIVE",
        ),
        eq(users.platformStatus, "ACTIVE"),
      ),
    )
    .orderBy(asc(users.displayName));
}

export async function getSectionOperationsWorkspace(
  context: RequestContext,
  sectionIdInput: string,
) {
  // A guessed Section UUID must not reveal even whether an administrative
  // workspace exists to Faculty, Mentor, Learner or disabled actors.
  if(!isSuperAdmin(context)&&!hasMembershipRole(context,"COLLEGE_ADMIN"))
    throw new AuthorizationError("academics.manage");
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const scope = await loadSectionScope(sectionId);

  // This is an operations workspace with full college learner/faculty
  // rosters and assignment choices. Ordinary academic read permission is
  // intentionally insufficient for Faculty/Learner users.
  requirePermission(context, "academics.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  const db = getDb();
  const [section] = await db
    .select({
      id: sections.id,
      name: sections.name,
      code: sections.code,
      capacity: sections.capacity,
      status: sections.status,
      cohortId: cohorts.id,
      cohortName: cohorts.name,
      cohortCode: cohorts.code,
      programId: programs.id,
      programName: programs.name,
      programCode: programs.code,
      academicPeriodId: academicPeriods.id,
      academicPeriodName: academicPeriods.name,
      academicPeriodCode: academicPeriods.code,
      academicPeriodStatus:
        academicPeriods.status,
      startDate: academicPeriods.startDate,
      endDate: academicPeriods.endDate,
    })
    .from(sections)
    .innerJoin(
      cohorts,
      eq(cohorts.id, sections.cohortId),
    )
    .innerJoin(
      programs,
      eq(programs.id, cohorts.programId),
    )
    .innerJoin(
      academicPeriods,
      eq(
        academicPeriods.id,
        sections.academicPeriodId,
      ),
    )
    // The section's program supplies the trusted college scope; a section
    // pointing at another tenant's academic period must fail closed instead
    // of disclosing the foreign period name, dates or timetable state.
    .where(and(
      eq(sections.id, sectionId),
      eq(academicPeriods.collegeId, scope.collegeId),
    ))
    .limit(1);

  if (!section) {
    throw new AcademicsServiceError(
      "SECTION_NOT_FOUND",
    );
  }

  const [
    programEnrollments,
    roster,
    facultyAssignments,
    scheduleEvents,
    learnerChoices,
    facultyChoices,
    courseChoices,
  ] = await Promise.all([
    listLearnerProgramEnrollments(
      context,
      section.programId,
      section.cohortId,
    ),
    listSectionRoster(context, sectionId),
    listSectionFacultyAssignments(
      context,
      sectionId,
      true,
    ),
    listSectionScheduleEvents(
      context,
      sectionId,
    ),
    listRoleChoices(scope.collegeId, "LEARNER"),
    listRoleChoices(scope.collegeId, "FACULTY"),
    listSectionScheduleCourseChoices(
      context,
      sectionId,
    ),
  ]);

  return {
    collegeId: scope.collegeId,
    section,
    programEnrollments,
    roster,
    facultyAssignments,
    scheduleEvents,
    learnerChoices,
    facultyChoices,
    courseChoices,
  };
}
