import "server-only";

import { and, count, eq, isNull, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,cohorts, collegeMemberships, courseLearningPaths, courseLessons, courseOfferings,
  courses, courseSectionDeliveries, courseTeachingAssignments, departments,
  lessonContents, lectureHalls, membershipRoles,
  placementJobs, programTermCourses, programTerms, programs, sections,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { collegeChecklistProjection, collegeSetupChecklistQuerySchema }
  from "./college-setup-checklist-model";

function requireOwnAdmin(context: RequestContext) {
  const m = context.membership;
  if (!m || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "college.read", {
      collegeId: m.collegeId, organizationId: m.organizationId,
    })) throw new AuthorizationError("college.read");
  requirePermission(context, "college.read", {
    collegeId: m.collegeId, organizationId: m.organizationId,
  });
  return m.collegeId;
}

export async function getCollegeSetupChecklist(context: RequestContext, raw: unknown = {}) {
  collegeSetupChecklistQuerySchema.parse(raw);
  const collegeId = requireOwnAdmin(context);
  const db = getDb();
  // Counts are from current registered records, not a synthetic progress percentage.
  const [
    dept, course, lesson, content, program, term, mapping,period,
    batch, section, faculty, assignment, student, hall, job,
  ] = await Promise.all([
    db.select({ count: count() }).from(departments)
      .where(and(eq(departments.collegeId, collegeId), isNull(departments.archivedAt))),
    db.select({ count: count() }).from(courses)
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(and(eq(departments.collegeId, collegeId), eq(courses.status, "ACTIVE"))),
    db.select({ count: count() }).from(courseLessons)
      .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(and(eq(departments.collegeId, collegeId), eq(courseLessons.status, "ACTIVE"))),
    db.select({ count: count() }).from(lessonContents)
      .innerJoin(courseLessons, eq(courseLessons.id, lessonContents.lessonId))
      .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(and(eq(departments.collegeId, collegeId), eq(lessonContents.status, "PUBLISHED"))),
    db.select({ count: count() }).from(programs)
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(eq(departments.collegeId, collegeId), eq(programs.status, "ACTIVE"))),
    db.select({ count: count() }).from(programTerms)
      .innerJoin(programs, eq(programs.id, programTerms.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(eq(departments.collegeId, collegeId), eq(programTerms.isActive, true))),
    db.select({ count: count() }).from(programTermCourses)
      .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
      .innerJoin(programs, eq(programs.id, programTerms.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(eq(departments.collegeId, collegeId)),
    db.select({ count: count() }).from(academicPeriods)
      .where(eq(academicPeriods.collegeId,collegeId)),
    db.select({ count: count() }).from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(eq(departments.collegeId, collegeId), ne(cohorts.status, "ARCHIVED"))),
    db.select({ count: count() }).from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(eq(departments.collegeId, collegeId), eq(sections.status, "ACTIVE"))),
    db.select({ count: count() }).from(membershipRoles)
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, membershipRoles.membershipId))
      .where(and(eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"), eq(membershipRoles.role, "FACULTY"))),
    db.select({ count: count() }).from(courseTeachingAssignments)
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, courseTeachingAssignments.membershipId))
      .innerJoin(courseSectionDeliveries, eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(and(eq(departments.collegeId, collegeId), eq(collegeMemberships.collegeId, collegeId),
        isNull(courseTeachingAssignments.endedAt), isNull(courseSectionDeliveries.endedAt))),
    db.select({ count: count() }).from(membershipRoles)
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, membershipRoles.membershipId))
      .where(and(eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"), eq(membershipRoles.role, "LEARNER"))),
    db.select({ count: count() }).from(lectureHalls)
      .where(and(eq(lectureHalls.collegeId, collegeId), eq(lectureHalls.status, "ACTIVE"))),
    db.select({ count: count() }).from(placementJobs)
      .where(and(eq(placementJobs.collegeId, collegeId), eq(placementJobs.status, "PUBLISHED"),
        isNull(placementJobs.archivedAt))),
  ]);
  const data = {
    departments: dept[0]?.count ?? 0,
    "course-list": course[0]?.count ?? 0,
    lessons: lesson[0]?.count ?? 0,
    "lesson-content": content[0]?.count ?? 0,
    programs: program[0]?.count ?? 0,
    semesters: term[0]?.count ?? 0,
    "semester-courses": mapping[0]?.count ?? 0,
    "academic-periods":period[0]?.count??0,
    batches: batch[0]?.count ?? 0,
    classes: section[0]?.count ?? 0,
    faculty: faculty[0]?.count ?? 0,
    "faculty-assignment": assignment[0]?.count ?? 0,
    students: student[0]?.count ?? 0,
    "lecture-halls": hall[0]?.count ?? 0,
    jobs: job[0]?.count ?? 0,
  };
  return { phases: collegeChecklistProjection(data), counts: data };
}
