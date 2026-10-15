import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, isNull, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  assignmentSubmissions,
  courseAssignments,
  courseLearningPaths,
  courseLessons,
  courseOfferings,
  courseQuizzes,
  courses,
  departments,
  quizAttempts,
} from "@/db/schema";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_ASSESSMENT_PAGE_SIZE,
  parseCollegeAssessmentQuery,
  type CollegeAssessmentAggregateItem,
  type CollegeAssessmentKind,
} from "./college-assessment-aggregate-model";

function textPattern(value: string) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

type AssessmentRow = Omit<
  CollegeAssessmentAggregateItem,
  "deliverySpecific" | "activityCount" | "resultsPublished"
> & { deliveryId: string | null; resultsPublished?: boolean | null };

export async function listCollegeAssessmentAggregate(
  context: RequestContext,
  kind: CollegeAssessmentKind,
  rawQuery: unknown,
) {
  const query = parseCollegeAssessmentQuery(kind, rawQuery);
  let collegeId: string;
  if (isSuperAdmin(context) && context.adminScope?.collegeId) {
    // Read-only Super Admin path; never resolve from a stale membership.
    collegeId = context.adminScope.collegeId;
    requirePermission(context, "courses.read", {
      collegeId, organizationId: context.adminScope.organizationId,
    });
  } else {
    if (
      !context.membership ||
      !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      context.membership.status !== "ACTIVE" ||
      context.user.platformStatus !== "ACTIVE"
    ) {
      throw new AuthorizationError("courses.read");
    }
    collegeId = context.membership.collegeId;
    requirePermission(context, "courses.read", {
      collegeId, organizationId: context.membership.organizationId,
    });
  }

  const db = getDb();
  // Deliberately keep the two Drizzle roots statically typed. Both are
  // registered, and neither page consults draft assessment storage tables.
  let rows: AssessmentRow[];
  let total: number;
  if (kind === "ASSIGNMENT") {
    const conditions = and(
      eq(departments.collegeId, collegeId),
      query.status === "ALL" ? undefined :
        eq(courseAssignments.status, query.status as "DRAFT" | "PUBLISHED" | "ARCHIVED"),
      query.courseCode ? eq(courses.code,query.courseCode) : undefined,
      query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
      query.scope==="SHARED"?isNull(courseAssignments.deliveryId):
        query.scope==="SECTION"?isNotNull(courseAssignments.deliveryId):undefined,
      query.duePresence==="SCHEDULED"?isNotNull(courseAssignments.dueAt):
        query.duePresence==="UNSCHEDULED"?isNull(courseAssignments.dueAt):undefined,
      query.dueWindow==="PAST"?sql`${courseAssignments.dueAt} < now()`:
        query.dueWindow==="FUTURE"?sql`${courseAssignments.dueAt} >= now()`:undefined,
      query.q ? ilike(courseAssignments.title, textPattern(query.q)) : undefined,
    );
    const scoped = db.select({
      id: sql<string>`${courseAssignments.id}`.mapWith(courseAssignments.id).as("assessment_id"),
      title: courseAssignments.title,
      courseName: sql<string>`${courses.name}`.mapWith(courses.name).as("course_name_alias"),
      courseCode: courses.code,
      lessonName: sql<string>`${courseLessons.name}`.mapWith(courseLessons.name).as("lesson_name_alias"),
      offeringId: sql<string>`${courseOfferings.id}`.mapWith(courseOfferings.id).as("offering_id_alias"),
      status: courseAssignments.status,
      dueAt: courseAssignments.dueAt,
      deliveryId: courseAssignments.deliveryId,
      points: courseAssignments.maxPoints,
    }).from(courseAssignments)
      .innerJoin(courseLessons, eq(courseLessons.id, courseAssignments.lessonId))
      .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .innerJoin(academicPeriods, and(eq(academicPeriods.id,courseOfferings.academicPeriodId),eq(academicPeriods.collegeId,collegeId)))
      .where(conditions).as("college_assignment_scope");
    const [totals, items] = await Promise.all([
      db.select({ total: count() }).from(scoped),
      db.select().from(scoped)
        .orderBy(desc(scoped.dueAt), asc(scoped.title), asc(scoped.id))
        .limit(COLLEGE_ASSESSMENT_PAGE_SIZE)
        .offset((query.page - 1) * COLLEGE_ASSESSMENT_PAGE_SIZE),
    ]);
    total = totals[0]?.total ?? 0;
    rows = items;
  } else {
    const conditions = and(
      eq(departments.collegeId, collegeId),
      query.status === "ALL" ? undefined :
        eq(courseQuizzes.status, query.status),
      query.courseCode ? eq(courses.code,query.courseCode) : undefined,
      query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
      query.scope==="SHARED"?isNull(courseQuizzes.deliveryId):
        query.scope==="SECTION"?isNotNull(courseQuizzes.deliveryId):undefined,
      query.duePresence==="SCHEDULED"?isNotNull(courseQuizzes.dueAt):
        query.duePresence==="UNSCHEDULED"?isNull(courseQuizzes.dueAt):undefined,
      query.dueWindow==="PAST"?sql`${courseQuizzes.dueAt} < now()`:
        query.dueWindow==="FUTURE"?sql`${courseQuizzes.dueAt} >= now()`:undefined,
      query.results!=="ALL"?eq(courseQuizzes.resultsPublished,query.results==="PUBLISHED"):undefined,
      query.q ? ilike(courseQuizzes.title, textPattern(query.q)) : undefined,
    );
    const scoped = db.select({
      id: sql<string>`${courseQuizzes.id}`.mapWith(courseQuizzes.id).as("assessment_id"),
      title: courseQuizzes.title,
      courseName: sql<string>`${courses.name}`.mapWith(courses.name).as("course_name_alias"),
      courseCode: courses.code,
      lessonName: sql<string>`${courseLessons.name}`.mapWith(courseLessons.name).as("lesson_name_alias"),
      offeringId: sql<string>`${courseOfferings.id}`.mapWith(courseOfferings.id).as("offering_id_alias"),
      status: courseQuizzes.status,
      dueAt: courseQuizzes.dueAt,
      deliveryId: courseQuizzes.deliveryId,
      points: courseQuizzes.totalPoints,
      resultsPublished: courseQuizzes.resultsPublished,
    }).from(courseQuizzes)
      .innerJoin(courseLessons, eq(courseLessons.id, courseQuizzes.lessonId))
      .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .innerJoin(academicPeriods, and(eq(academicPeriods.id,courseOfferings.academicPeriodId),eq(academicPeriods.collegeId,collegeId)))
      .where(conditions).as("college_quiz_scope");
    const [totals, items] = await Promise.all([
      db.select({ total: count() }).from(scoped),
      db.select().from(scoped)
        .orderBy(desc(scoped.dueAt), asc(scoped.title), asc(scoped.id))
        .limit(COLLEGE_ASSESSMENT_PAGE_SIZE)
        .offset((query.page - 1) * COLLEGE_ASSESSMENT_PAGE_SIZE),
    ]);
    total = totals[0]?.total ?? 0;
    rows = items;
  }

  // The only IDs used for counting come from the authorized, paginated
  // college-filtered result. Quiz counts are attempts (not unique learners).
  const ids = rows.map((row) => row.id);
  const counts = ids.length === 0 ? [] :
    kind === "ASSIGNMENT" ?
      await db.select({
        id: assignmentSubmissions.assignmentId,
        total: count(),
      }).from(assignmentSubmissions)
        .where(inArray(assignmentSubmissions.assignmentId, ids))
        .groupBy(assignmentSubmissions.assignmentId) :
      await db.select({
        id: quizAttempts.quizId,
        total: count(),
      }).from(quizAttempts)
        .where(inArray(quizAttempts.quizId, ids))
        .groupBy(quizAttempts.quizId);
  const countById = new Map(counts.map((row) => [row.id, row.total]));
  const items: CollegeAssessmentAggregateItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    courseName: row.courseName,
    courseCode: row.courseCode,
    lessonName: row.lessonName,
    offeringId: row.offeringId,
    status: row.status,
    dueAt: row.dueAt,
    deliverySpecific: row.deliveryId !== null,
    points: row.points,
    activityCount: countById.get(row.id) ?? 0,
    resultsPublished: kind==="QUIZ" ? row.resultsPublished ?? false : null,
  }));
  return {
    kind,
    collegeId,
    query,
    items,
    total,
    page: query.page,
    pageSize: COLLEGE_ASSESSMENT_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / COLLEGE_ASSESSMENT_PAGE_SIZE)),
  };
}
