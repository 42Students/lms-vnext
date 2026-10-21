import "server-only";

import { and, asc, count, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { aliasedColumn } from "@/db/aliased-column";
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
  programTerms,
  programTermCourses,
  programs,
  facultyProfiles,
  sections,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_MAPPING_PAGE_SIZE,
  facultyAssignmentQuerySchema,
  facultyAssignmentState,
  mappingPageCount,
  semesterCourseQuerySchema,
} from "./college-mapping-model";

const programDepartment = alias(departments, "mapping_program_department");
const facultyDepartment = alias(departments,"mapping_faculty_department");

async function requireCollegeAdmin(context: RequestContext) {
  const acting=await resolveActingCollege(context,"courses.read");
  requirePermission(context,"courses.read",{
    collegeId:acting.collegeId,organizationId:acting.organizationId,
  });
  return acting.collegeId;
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
  const collegeId = await requireCollegeAdmin(context);
  const db = getDb();
  const source = db.select({
    id: aliasedColumn(courseOfferings.id, "sc_id"),
    courseId: aliasedColumn(courses.id, "sc_course_id"),
    courseName: aliasedColumn(courses.name, "sc_course_name"),
    courseCode: aliasedColumn(courses.code, "sc_course_code"),
    cohortName: aliasedColumn(cohorts.name, "sc_cohort_name"),
    programName: aliasedColumn(programs.name, "sc_program_name"),
    programId: aliasedColumn(programs.id, "sc_program_id"),
    periodName: aliasedColumn(academicPeriods.name, "sc_period_name"),
    periodCode: aliasedColumn(academicPeriods.code, "sc_period_code"),
    type: aliasedColumn(courseOfferings.type, "sc_type"),
    credits: aliasedColumn(courseOfferings.credits, "sc_credits"),
    status: aliasedColumn(courseOfferings.status, "sc_status"),
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
      query.courseCode ? eq(courses.code,query.courseCode) : undefined,
      query.type !== "ALL" ? eq(courseOfferings.type, query.type) : undefined,
      query.status !== "ALL" ? eq(courseOfferings.status,query.status) : undefined,
      query.q ? or(
        ilike(courses.name, pattern(query.q)),
        ilike(courses.code, pattern(query.q)),
        ilike(cohorts.name, pattern(query.q)),
      ) : undefined,
    )).as("scoped_semester_courses");

  // The old semester is an ordinal program term, not an academic period.
  // Present both identities: mapping edits occur in the term editor while
  // class delivery is managed as a separate, scoped course offering.
  const [totals, items, programChoices, periodChoices, termMappings] = await Promise.all([
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
    db.select({
      id: programTermCourses.id,
      programId: programTerms.programId,
      courseId: programTermCourses.courseId,
      semesterId: programTerms.id,
      semesterNumber: programTerms.termNumber,
      semesterName: programTerms.name,
      courseType:programTermCourses.type,
      courseCredits:programTermCourses.credits,
      mandatory:programTermCourses.legacyIsMandatory,
    }).from(programTermCourses)
      .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
      .innerJoin(programs, eq(programs.id, programTerms.programId))
      .innerJoin(programDepartment, and(
        eq(programDepartment.id, programs.departmentId),
        eq(programDepartment.collegeId, collegeId),
      ))
      .where(query.programId ? eq(programs.id, query.programId) : undefined)
      .orderBy(asc(programs.name),asc(programTerms.termNumber),asc(programTermCourses.displayOrder),asc(programTermCourses.id)),
  ]);
  const total = totals[0]?.total ?? 0;
  const termByCourse = new Map<string, typeof termMappings>();
  for (const term of termMappings) {
    const key = term.programId + ":" + term.courseId;
    const current = termByCourse.get(key) ?? [];
    current.push(term);
    termByCourse.set(key, current);
  }
  return {
    query,
    items: items.map(item => ({
      ...item,
      programSemesterMappings: termByCourse.get(item.programId + ":" + item.courseId) ?? [],
      semesterEditorHref: "/college/semester-courses",
    })),
    total,
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
  const collegeId = await requireCollegeAdmin(context);
  const db = getDb();
  const source = db.select({
    id: aliasedColumn(courseTeachingAssignments.id, "fa_id"),
    updatedAt: sql<Date>`${courseTeachingAssignments.updatedAt}`
      .mapWith(courseTeachingAssignments.updatedAt).as("assignment_updated_at"),
    deliveryId: aliasedColumn(courseTeachingAssignments.deliveryId, "fa_delivery_id"),
    membershipId: aliasedColumn(courseTeachingAssignments.membershipId, "fa_membership_id"),
    facultyName: aliasedColumn(users.displayName, "fa_faculty_name"),
    facultyFirstName:aliasedColumn(users.legacyFirstName,"fa_first_name"),
    facultyLastName:aliasedColumn(users.legacyLastName,"fa_last_name"),
    facultyDepartmentName:aliasedColumn(facultyDepartment.name,"fa_department_name"),
    facultyDepartmentId:aliasedColumn(facultyDepartment.id,"fa_department_id"),
    courseName: aliasedColumn(courses.name, "fa_course_name"),
    courseCode: aliasedColumn(courses.code, "fa_course_code"),
    sectionName: aliasedColumn(sections.name, "fa_section_name"),
    cohortName: aliasedColumn(cohorts.name, "fa_cohort_name"),
    periodName: aliasedColumn(academicPeriods.name, "fa_period_name"),
    offeringId: aliasedColumn(courseOfferings.id, "fa_offering_id"),
    role: aliasedColumn(courseTeachingAssignments.role, "fa_role"),
    startedAt: aliasedColumn(courseTeachingAssignments.startedAt, "fa_started_at"),
    endedAt: aliasedColumn(courseTeachingAssignments.endedAt, "fa_ended_at"),
    deliveryEndedAt: aliasedColumn(courseSectionDeliveries.endedAt, "fa_delivery_ended_at"),
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
    .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
    .leftJoin(facultyDepartment,and(eq(facultyDepartment.id,facultyProfiles.primaryDepartmentId),
      eq(facultyDepartment.collegeId,collegeId)))
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
      query.role !== "ALL" ? eq(courseTeachingAssignments.role, query.role) : undefined,
      query.courseCode ? eq(courses.code, query.courseCode) : undefined,
      query.sectionCode ? eq(sections.code, query.sectionCode) : undefined,
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
      facultyFirstName:item.facultyFirstName?.trim()||
        item.facultyName?.trim().split(/\s+/)[0]||"Faculty",
      facultyDepartment:item.facultyDepartmentName??"Not assigned",
      state: facultyAssignmentState(item.endedAt, item.deliveryEndedAt),
    })),
    total, totalPages: mappingPageCount(total),
  };
}
