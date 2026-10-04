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
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
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
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const scope = await loadSectionScope(sectionId);

  requirePermission(context, "academics.read", {
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
    .where(eq(sections.id, sectionId))
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
