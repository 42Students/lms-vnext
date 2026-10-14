import "server-only";

import { and, asc, count, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  courses,
  departments,
  membershipRoles,
  programs,
  sections,
  users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_MAPPING_PAGE_SIZE,
  facultyAssignmentQuerySchema,
  facultyAssignmentState,
  mappingPageCount,
  semesterCourseQuerySchema,
} from "./college-mapping-model";

const programDepartment = alias(departments, "mapping_program_department");

function requireCollegeAdmin(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "courses.read", {
        collegeId: member.collegeId,
        organizationId: member.organizationId,
      })) {
    throw new AuthorizationError("courses.read");
  }
  requirePermission(context, "courses.read", {
    collegeId: member.collegeId,
    organizationId: member.organizationId,
  });
  return member.collegeId;
}

function pattern(value: string) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

/** Academic-period/cohort offerings, NOT a legacy semester ordinal mapping. */
export async function listCollegeSemesterCourseMappings(
  context: RequestContext,
  raw: unknown,
) {
  const query = semesterCourseQuerySchema.parse(raw);
  const collegeId = requireCollegeAdmin(context);
  const db = getDb();
  const source = db.select({
    id: sql<string>`${courseOfferings.id}`.mapWith(courseOfferings.id).as("college_mapping_offering_id"),
    courseName: sql<string>`${courses.name}`.mapWith(courses.name).as("college_mapping_course_name"),
    courseCode: sql<string>`${courses.code}`.mapWith(courses.code).as("college_mapping_course_code"),
    cohortName: sql<string>`${cohorts.name}`.mapWith(cohorts.name).as("college_mapping_cohort_name"),
    programName: sql<string>`${programs.name}`.mapWith(programs.name).as("college_mapping_program_name"),
    programId: sql<string>`${programs.id}`.mapWith(programs.id).as("college_mapping_program_id"),
    periodName: sql<string>`${academicPeriods.name}`.mapWith(academicPeriods.name).as("college_mapping_period_name"),
    periodCode: sql<string>`${academicPeriods.code}`.mapWith(academicPeriods.code).as("college_mapping_period_code"),
    type: courseOfferings.type,
    credits: courseOfferings.credits,
    status: courseOfferings.status,
  }).from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, and(
      eq(departments.id, courses.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(programDepartment, and(
      eq(programDepartment.id, programs.departmentId),
      eq(programDepartment.collegeId, collegeId),
    ))
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, courseOfferings.academicPeriodId),
      eq(academicPeriods.collegeId, collegeId),
    ))
    .where(and(
      query.programId ? eq(programs.id, query.programId) : undefined,
      query.periodId ? eq(academicPeriods.id, query.periodId) : undefined,
      query.q ? or(
        ilike(courses.name, pattern(query.q)),
        ilike(courses.code, pattern(query.q)),
        ilike(cohorts.name, pattern(query.q)),
      ) : undefined,
    )).as("scoped_semester_courses");

  const [totals, items, programChoices, periodChoices] = await Promise.all([
    db.select({ total: count() }).from(source),
    db.select().from(source)
      .orderBy(asc(source.programName), asc(source.periodName), asc(source.courseName), asc(source.id))
      .limit(COLLEGE_MAPPING_PAGE_SIZE)
      .offset((query.page - 1) * COLLEGE_MAPPING_PAGE_SIZE),
    db.select({ id: programs.id, name: programs.name, code: programs.code })
      .from(programs)
      .innerJoin(programDepartment, and(
        eq(programDepartment.id, programs.departmentId),
        eq(programDepartment.collegeId, collegeId),
      ))
      .orderBy(asc(programs.name), asc(programs.id)),
    db.select({ id: academicPeriods.id, name: academicPeriods.name, code: academicPeriods.code })
      .from(academicPeriods)
      .where(eq(academicPeriods.collegeId, collegeId))
      .orderBy(asc(academicPeriods.name), asc(academicPeriods.id)),
  ]);
  const total = totals[0]?.total ?? 0;
  return {
    query, items, total,
    programs: programChoices, periods: periodChoices,
    totalPages: mappingPageCount(total),
  };
}

/** Authored teaching assignments with both teacher and delivery in-college. */
export async function listCollegeFacultyAssignments(
  context: RequestContext,
  raw: unknown,
) {
  const query = facultyAssignmentQuerySchema.parse(raw);
  const collegeId = requireCollegeAdmin(context);
  const db = getDb();
  const source = db.select({
    id: courseTeachingAssignments.id,
    updatedAt: sql<Date>`${courseTeachingAssignments.updatedAt}`
      .mapWith(courseTeachingAssignments.updatedAt).as("assignment_updated_at"),
    deliveryId: courseTeachingAssignments.deliveryId,
    membershipId: courseTeachingAssignments.membershipId,
    facultyName: users.displayName,
    courseName: courses.name,
    courseCode: courses.code,
    sectionName: sections.name,
    cohortName: cohorts.name,
    periodName: academicPeriods.name,
    offeringId: courseOfferings.id,
    role: courseTeachingAssignments.role,
    startedAt: courseTeachingAssignments.startedAt,
    endedAt: courseTeachingAssignments.endedAt,
    deliveryEndedAt: courseSectionDeliveries.endedAt,
  }).from(courseTeachingAssignments)
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, courseTeachingAssignments.membershipId),
      eq(collegeMemberships.collegeId, collegeId),
    ))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "FACULTY"),
    ))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(courseSectionDeliveries, eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, and(
      eq(departments.id, courses.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
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
    ))
    .where(and(
      query.status === "ACTIVE" ? and(
        isNull(courseTeachingAssignments.endedAt),
        isNull(courseSectionDeliveries.endedAt),
      ) : query.status === "ENDED" ? or(
        isNotNull(courseTeachingAssignments.endedAt),
        isNotNull(courseSectionDeliveries.endedAt),
      ) : undefined,
      query.q ? or(
        ilike(users.displayName, pattern(query.q)),
        ilike(courses.name, pattern(query.q)),
        ilike(courses.code, pattern(query.q)),
        ilike(sections.name, pattern(query.q)),
      ) : undefined,
    )).as("scoped_faculty_assignments");

  const [totals, entries] = await Promise.all([
    db.select({ total: count() }).from(source),
    db.select().from(source)
      .orderBy(asc(source.courseName), asc(source.sectionName), asc(source.facultyName), asc(source.id))
      .limit(COLLEGE_MAPPING_PAGE_SIZE)
      .offset((query.page - 1) * COLLEGE_MAPPING_PAGE_SIZE),
  ]);
  const total = totals[0]?.total ?? 0;
  return {
    query,
    items: entries.map(item => ({
      ...item,
      facultyName: item.facultyName?.trim() || "Unnamed faculty",
      state: facultyAssignmentState(item.endedAt, item.deliveryEndedAt),
    })),
    total, totalPages: mappingPageCount(total),
  };
}
