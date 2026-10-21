import "server-only";

import { and, asc, count, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  attendanceRecords, attendanceSessions, cohorts, collegeMemberships,
  departments, learnerProfiles, learnerProgramEnrollments, membershipRoles,
  programs, sectionEnrollments, sectionScheduleEvents, sections, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  collegeStudentEnrollmentQuerySchema, collegePersonIdSchema,
  CollegePersonNotFoundError, recordedAttendanceSummary,
} from "./college-person-detail-model";

export async function getCollegeStudentDetail(
  context: RequestContext, membershipIdInput: unknown, rawQuery: unknown = {},
) {
  const membershipId = collegePersonIdSchema.parse(membershipIdInput);
  const filter=collegeStudentEnrollmentQuerySchema.parse(rawQuery);
  const owner = context.membership;
  if (!owner || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "people.manage", {collegeId: owner.collegeId, organizationId: owner.organizationId})) {
    throw new AuthorizationError("people.manage");
  }
  requirePermission(context, "people.manage", {
    collegeId: owner.collegeId, organizationId: owner.organizationId,
  });
  const db = getDb();
  const [person] = await db.select({
    id: collegeMemberships.id,
    name: users.displayName,
    status: collegeMemberships.status,
    rollNumber: learnerProfiles.rollNumber,
    registrationNumber: learnerProfiles.registrationNumber,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
    .where(and(
      eq(collegeMemberships.id, membershipId),
      eq(collegeMemberships.collegeId, owner.collegeId),
    )).limit(1);
  if (!person) throw new CollegePersonNotFoundError();

  const enrollments = await db.select({
    id: learnerProgramEnrollments.id,
    status: learnerProgramEnrollments.status,
    programName: programs.name,
    programCode: programs.code,
    cohortName: cohorts.name,
    cohortCode: cohorts.code,
  }).from(learnerProgramEnrollments)
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, owner.collegeId),
    ))
    .innerJoin(cohorts, and(
      eq(cohorts.id, learnerProgramEnrollments.cohortId),
      eq(cohorts.programId, programs.id),
    ))
    .where(eq(learnerProgramEnrollments.membershipId, membershipId))
    .orderBy(asc(programs.name), asc(cohorts.name));

  const activeEnrollIds = enrollments.filter(r => r.status === "ACTIVE").map(r => r.id);
  const classes = activeEnrollIds.length
    ? await db.select({
      enrollmentId: sectionEnrollments.learnerEnrollmentId,
      sectionName: sections.name, sectionCode: sections.code,
    }).from(sectionEnrollments)
      .innerJoin(sections, and(
        eq(sections.id, sectionEnrollments.sectionId),
        eq(sections.status, "ACTIVE"),
        eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
      ))
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, owner.collegeId),
      ))
      .where(and(
        eq(sectionEnrollments.status, "ACTIVE"),
        inArray(sectionEnrollments.learnerEnrollmentId, activeEnrollIds),
      ))
    : [];
  // Only explicitly recorded statuses for MARKED sessions. PRESENT may have no row.
  const attendance = await db.select({
    status: attendanceRecords.status,
    count: count(),
  }).from(attendanceRecords)
    .innerJoin(attendanceSessions, and(
      eq(attendanceSessions.scheduleEventId, attendanceRecords.scheduleEventId),
      eq(attendanceSessions.status, "MARKED"),
    ))
    .innerJoin(sectionScheduleEvents, eq(sectionScheduleEvents.id, attendanceRecords.scheduleEventId))
    .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, owner.collegeId),
    ))
    .where(eq(attendanceRecords.membershipId, membershipId))
    .groupBy(attendanceRecords.status);

  return {
    person: {
      id: person.id,
      name: person.name ?? "Unnamed learner",
      status: person.status,
      rollNumber: person.rollNumber,
      registrationNumber: person.registrationNumber,
    },
    filter,
    enrollments:filter.status === "ALL" ? enrollments : enrollments.filter(row=>row.status===filter.status),
    enrollmentTotal:enrollments.length,
    classes,
    attendance: recordedAttendanceSummary(attendance),
  };
}
