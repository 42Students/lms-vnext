import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohortProgressionState,
  cohorts,
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  departments,
  membershipRoles,
  programs,
  sections,
  users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";

const programDepartment = alias(departments, "college_assign_program_department");
const MAX_CHOICES = 200;
const CLASS_FILTER_CHOICES = 1000;

/** Selector data is fenced by the same college on EVERY relevant parent. */
export async function listCollegeTeachingOptions(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "courses.manage", {
      collegeId: member.collegeId,
      organizationId: member.organizationId,
    })) {
    throw new AuthorizationError("courses.manage");
  }
  requirePermission(context, "courses.manage", {
    collegeId: member.collegeId,
    organizationId: member.organizationId,
  });
  const collegeId = member.collegeId;
  const db = getDb();
  const [deliveries, faculty, classRows] = await Promise.all([
    db.select({
      id: courseSectionDeliveries.id,
      courseName: courses.name,
      courseCode: courses.code,
      sectionName: sections.name,
      sectionCode: sections.code,
      cohortName: cohorts.name,
      periodName: academicPeriods.name,
      periodId: academicPeriods.id,
      programId: programs.id,
      programName: programs.name,
      cohortId: cohorts.id,
      sectionId: sections.id,
      semesterNumber: cohortProgressionState.currentTermNumber,
      academicYear: academicPeriods.name,
    }).from(courseSectionDeliveries)
      .innerJoin(courseOfferings, and(
        eq(courseOfferings.id, courseSectionDeliveries.offeringId),
        eq(courseOfferings.status, "ACTIVE"),
      ))
      .innerJoin(courses, and(
        eq(courses.id, courseOfferings.courseId),
        eq(courses.status, "ACTIVE"),
      ))
      .innerJoin(departments, and(
        eq(departments.id, courses.departmentId),
        eq(departments.collegeId, collegeId),
      ))
      .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .leftJoin(cohortProgressionState, eq(cohortProgressionState.cohortId, cohorts.id))
      .innerJoin(programDepartment, and(
        eq(programDepartment.id, programs.departmentId),
        eq(programDepartment.collegeId, collegeId),
      ))
      .innerJoin(academicPeriods, and(
        eq(academicPeriods.id, courseOfferings.academicPeriodId),
        eq(academicPeriods.collegeId, collegeId),
      ))
      .innerJoin(sections, and(
        eq(sections.id, courseSectionDeliveries.sectionId),
        eq(sections.cohortId, cohorts.id),
        eq(sections.academicPeriodId, academicPeriods.id),
        eq(sections.status, "ACTIVE"),
      ))
      .where(isNull(courseSectionDeliveries.endedAt))
      .orderBy(asc(courses.name), asc(cohorts.name), asc(sections.name), asc(courseSectionDeliveries.id))
      .limit(MAX_CHOICES + 1),
    db.select({
      id: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
    }).from(collegeMemberships)
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "FACULTY"),
      ))
      .innerJoin(users, and(
        eq(users.id, collegeMemberships.userId),
        eq(users.platformStatus, "ACTIVE"),
      ))
      .where(and(
        eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ))
      .orderBy(asc(users.displayName), asc(collegeMemberships.id))
      .limit(MAX_CHOICES + 1),
    // Legacy class filter listed every class of the college. Current and
    // historical sections of this college are offered, independent of which
    // classes currently have an active delivery (fenced by program department).
    db.select({ code: sections.code, name: sections.name })
      .from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(programDepartment, and(
        eq(programDepartment.id, programs.departmentId),
        eq(programDepartment.collegeId, collegeId),
      ))
      .orderBy(asc(sections.name), asc(sections.code))
      .limit(CLASS_FILTER_CHOICES),
  ]);
  return {
    deliveries: deliveries.slice(0, MAX_CHOICES).map(item => ({
      id: item.id,
      label: [item.courseName + " (" + item.courseCode + ")", item.cohortName,
        item.sectionName, item.periodName].join(" · "),
      programId: item.programId, programName: item.programName,
      cohortId: item.cohortId, cohortName: item.cohortName,
      sectionId: item.sectionId, sectionName: item.sectionName, sectionCode: item.sectionCode,
      semesterNumber: item.semesterNumber, academicYear: item.academicYear,
      courseName: item.courseName, courseCode: item.courseCode,
    })),
    faculty: faculty.slice(0, MAX_CHOICES).map(item => ({
      id: item.id,
      label: item.displayName?.trim() || item.email?.trim() || "Unnamed faculty",
    })),
    classes: classRows,
    deliveriesTruncated: deliveries.length > MAX_CHOICES,
    facultyTruncated: faculty.length > MAX_CHOICES,
  };
}
