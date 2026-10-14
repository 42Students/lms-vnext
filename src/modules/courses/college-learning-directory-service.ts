import "server-only";

import { and, asc, count, eq, inArray, sql, type Column } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  collegeMemberships,
  courseLearningPaths,
  courseLessons,
  courseOfferings,
  courses,
  departments,
  learnerContentProgress,
  lessonContents,
  membershipRoles,
  programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_LEARNING_PAGE_SIZE,
  collegeLearningPageCount,
  collegeLearningQuerySchema,
  collegeLessonQuerySchema,
  type CollegeLessonRecord,
  type CollegeCourseProgressRecord,
} from "./college-learning-directory-model";

const cohortDepartment = alias(departments, "learning_cohort_department");

function requireCollegeCoursesRead(context: RequestContext) {
  // These two service exports are read-only; selected Super Admin scope is a
  // separate explicit read path, never an implicit college membership.
  if (isSuperAdmin(context) && context.adminScope?.collegeId) {
    requirePermission(context, "courses.read", {
      collegeId: context.adminScope.collegeId,
      organizationId: context.adminScope.organizationId,
    });
    return context.adminScope.collegeId;
  }
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

function searchLike(value: string) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

/** Aliases a selected column so subquery output names stay unique (Postgres 42702). */
function aliased<C extends Column>(column: C, name: string) {
  return sql<C["_"]["data"]>`${column}`.mapWith(column).as(name);
}

/** All source tables are in registered C1-C3 migrations. An unavailable table
 * is a hard operational error, not an empty list or a fabricated metric. */
export async function listCollegeLessons(context: RequestContext, raw: unknown) {
  const query = collegeLessonQuerySchema.parse(raw);
  const collegeId = requireCollegeCoursesRead(context);
  const db = getDb();
  const scoped = db.select({
    id: aliased(courseLessons.id, "lesson_id_alias"),
    name: aliased(courseLessons.name, "lesson_name_alias"),
    sequence: courseLessons.sequence,
    status: aliased(courseLessons.status, "lesson_status_alias"),
    pathStatus: aliased(courseLearningPaths.status, "path_status_alias"),
    offeringId: aliased(courseOfferings.id, "offering_id_alias"),
    offeringStatus: aliased(courseOfferings.status, "offering_status_alias"),
    courseName: aliased(courses.name, "course_name_alias"),
    courseCode: courses.code,
    cohortName: aliased(cohorts.name, "cohort_name_alias"),
    periodName: aliased(academicPeriods.name, "period_name_alias"),
  }).from(courseLessons)
    .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, and(
      eq(departments.id, courses.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(cohortDepartment, and(
      eq(cohortDepartment.id, programs.departmentId),
      eq(cohortDepartment.collegeId, collegeId),
    ))
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, courseOfferings.academicPeriodId),
      eq(academicPeriods.collegeId, collegeId),
    ))
    .where(and(
      query.status === "ALL" ? undefined : eq(courseLessons.status, query.status),
      query.offeringStatus === "ALL" ? undefined : eq(courseOfferings.status, query.offeringStatus),
      query.courseCode ? eq(courses.code,query.courseCode) : undefined,
      query.q ? sql`(${courseLessons.name} ilike ${searchLike(query.q)} or
        ${courses.name} ilike ${searchLike(query.q)} or
        ${courses.code} ilike ${searchLike(query.q)})` : undefined,
    )).as("college_lessons");

  const [countRows, baseRows] = await Promise.all([
    db.select({ total: count() }).from(scoped),
    db.select().from(scoped)
      .orderBy(asc(scoped.courseName), asc(scoped.cohortName), asc(scoped.sequence), asc(scoped.id))
      .limit(COLLEGE_LEARNING_PAGE_SIZE)
      .offset((query.page - 1) * COLLEGE_LEARNING_PAGE_SIZE),
  ]);
  const ids = baseRows.map(r => r.id);
  const counts = ids.length === 0 ? [] : await db.select({
    id: lessonContents.lessonId,
    total: count(),
    published: sql<number>`count(*) filter (where ${lessonContents.status} = 'PUBLISHED')`.mapWith(Number),
  }).from(lessonContents)
    .where(inArray(lessonContents.lessonId, ids))
    .groupBy(lessonContents.lessonId);
  const byLesson = new Map(counts.map(r => [r.id, r]));
  const items: CollegeLessonRecord[] = baseRows.map(row => ({
    ...row,
    contentCount: byLesson.get(row.id)?.total ?? 0,
    publishedContentCount: byLesson.get(row.id)?.published ?? 0,
  }));
  const total = countRows[0]?.total ?? 0;
  return { kind: "LESSONS" as const, query, items, total, totalPages: collegeLearningPageCount(total) };
}

/** Recorded *content events* per offering, never attendance/quiz completion,
 * enrollment readiness or a percentage of eligible learners. */
export async function listCollegeCourseProgress(context: RequestContext, raw: unknown) {
  const query = collegeLearningQuerySchema.parse(raw);
  const collegeId = requireCollegeCoursesRead(context);
  const db = getDb();
  const scoped = db.select({
    offeringId: aliased(courseOfferings.id, "offering_id_alias"),
    offeringStatus: aliased(courseOfferings.status, "offering_status_alias"),
    courseName: aliased(courses.name, "course_name_alias"),
    courseCode: courses.code,
    cohortName: aliased(cohorts.name, "cohort_name_alias"),
    periodName: aliased(academicPeriods.name, "period_name_alias"),
  }).from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, and(
      eq(departments.id, courses.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(cohortDepartment, and(
      eq(cohortDepartment.id, programs.departmentId),
      eq(cohortDepartment.collegeId, collegeId),
    ))
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, courseOfferings.academicPeriodId),
      eq(academicPeriods.collegeId, collegeId),
    ))
    .where(and(
      query.status === "ALL" ? undefined : eq(courseOfferings.status, query.status),
      query.q ? sql`(${courses.name} ilike ${searchLike(query.q)} or
        ${courses.code} ilike ${searchLike(query.q)} or
        ${cohorts.name} ilike ${searchLike(query.q)})` : undefined,
    )).as("college_progress_offerings");
  const [countRows, baseRows] = await Promise.all([
    db.select({ total: count() }).from(scoped),
    db.select().from(scoped)
      .orderBy(asc(scoped.courseName), asc(scoped.cohortName), asc(scoped.offeringId))
      .limit(COLLEGE_LEARNING_PAGE_SIZE)
      .offset((query.page - 1) * COLLEGE_LEARNING_PAGE_SIZE),
  ]);
  const ids = baseRows.map(r => r.offeringId);
  const progress = ids.length === 0 ? [] : await db.select({
    offeringId: courseLearningPaths.offeringId,
    recordedRows: count(),
    completedRows: sql<number>`count(*) filter (where ${learnerContentProgress.completedAt} is not null)`.mapWith(Number),
    learnerCount: sql<number>`count(distinct ${learnerContentProgress.membershipId})`.mapWith(Number),
  }).from(learnerContentProgress)
    .innerJoin(lessonContents, eq(lessonContents.id, learnerContentProgress.lessonContentId))
    .innerJoin(courseLessons, eq(courseLessons.id, lessonContents.lessonId))
    .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, learnerContentProgress.membershipId),
      eq(collegeMemberships.collegeId, collegeId),
    ))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(inArray(courseLearningPaths.offeringId, ids))
    .groupBy(courseLearningPaths.offeringId);
  const byOffering = new Map(progress.map(r => [r.offeringId, r]));
  const items: CollegeCourseProgressRecord[] = baseRows.map(row => ({
    ...row,
    recordedRows: byOffering.get(row.offeringId)?.recordedRows ?? 0,
    completedRows: byOffering.get(row.offeringId)?.completedRows ?? 0,
    learnersWithRecords: byOffering.get(row.offeringId)?.learnerCount ?? 0,
  }));
  const total = countRows[0]?.total ?? 0;
  return { kind: "PROGRESS" as const, query, items, total, totalPages: collegeLearningPageCount(total) };
}
