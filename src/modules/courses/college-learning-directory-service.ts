import "server-only";

import { and, asc, count, eq, exists, inArray, not, sql, type Column } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  collegeMemberships,
  courseAssignments,
  courseLearningPaths,
  courseLessons,
  courseQuizzes,
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
  collegeLessonQuerySchema,
  collegeProgressQuerySchema,
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
      query.maxContentCount!==undefined?sql`(SELECT count(*) FROM ${lessonContents} WHERE ${lessonContents.lessonId}=${courseLessons.id}) <= ${query.maxContentCount}`:undefined,
      query.minContentCount!==undefined?sql`(SELECT count(*) FROM ${lessonContents} WHERE ${lessonContents.lessonId}=${courseLessons.id}) >= ${query.minContentCount}`:undefined,
      query.pathId?eq(courseLearningPaths.id,query.pathId):undefined,
      query.offeringId?eq(courseOfferings.id,query.offeringId):undefined,
      query.lessonId?eq(courseLessons.id,query.lessonId):undefined,
      query.liveEvidence==="HAS_LIVE"?exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.contentType,"LIVE_CLASS")))):query.liveEvidence==="NO_LIVE"?not(exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.contentType,"LIVE_CLASS"))))):undefined,
      query.resourceEvidence==="HAS_RESOURCE"?exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.contentType,"RESOURCE")))):query.resourceEvidence==="NO_RESOURCE"?not(exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.contentType,"RESOURCE"))))):undefined,
      query.videoEvidence==="HAS_VIDEO"?exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),inArray(lessonContents.contentType,["VIDEO","YOUTUBE"])))):query.videoEvidence==="NO_VIDEO"?not(exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),inArray(lessonContents.contentType,["VIDEO","YOUTUBE"]))))):undefined,
      query.hiddenPublished==="HAS_HIDDEN"?exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.status,"PUBLISHED"),eq(lessonContents.visibleToStudents,false)))):query.hiddenPublished==="NO_HIDDEN"?not(exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.status,"PUBLISHED"),eq(lessonContents.visibleToStudents,false))))):undefined,
      query.contentAudience==="SHARED"?exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),sql`${lessonContents.deliveryId} IS  NULL`))):
        query.contentAudience==="SECTION"?exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),sql`${lessonContents.deliveryId} IS NOT NULL`))):undefined,
      query.lessonName ? eq(courseLessons.name, query.lessonName) : undefined,
      query.sequenceThrough !== undefined ? sql`${courseLessons.sequence} <= ${query.sequenceThrough - 1}` : undefined,
      query.sequenceFrom !== undefined ? sql`${courseLessons.sequence} >= ${query.sequenceFrom - 1}` : undefined,
      query.contentLifecycle !== "ALL" ? exists(db.select({id: lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId, courseLessons.id),eq(lessonContents.status, query.contentLifecycle)))) : undefined,
      query.contentType !== "ALL" ? exists(db.select({id: lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId, courseLessons.id),eq(lessonContents.contentType, query.contentType)))) : undefined,
      query.departmentCode ? eq(departments.name,query.departmentCode) : undefined,
      query.courseStatus !== "ALL" ? eq(courses.status,query.courseStatus) : undefined,
      query.periodStatus !== "ALL" ? eq(academicPeriods.status,query.periodStatus) : undefined,
      query.cohortStatus !== "ALL" ? eq(cohorts.status,query.cohortStatus) : undefined,
      query.programStatus !== "ALL" ? eq(programs.status,query.programStatus) : undefined,
      query.offeringStatus === "ALL" ? undefined : eq(courseOfferings.status, query.offeringStatus),
      query.pathStatus === "ALL" ? undefined : eq(courseLearningPaths.status,query.pathStatus),
      query.offeringType&&query.offeringType!=="ALL"?eq(courseOfferings.type,query.offeringType):undefined,
      query.departmentName?eq(departments.name,query.departmentName):undefined,
      query.quizPresence==="HAS_QUIZZES"?exists(db.select({id:courseQuizzes.id}).from(courseQuizzes).where(eq(courseQuizzes.lessonId,courseLessons.id))):
        query.quizPresence==="NO_QUIZZES"?not(exists(db.select({id:courseQuizzes.id}).from(courseQuizzes).where(eq(courseQuizzes.lessonId,courseLessons.id)))):undefined,
      query.assignmentPresence==="HAS_ASSIGNMENTS"?exists(db.select({id:courseAssignments.id}).from(courseAssignments).where(eq(courseAssignments.lessonId,courseLessons.id))):
        query.assignmentPresence==="NO_ASSIGNMENTS"?not(exists(db.select({id:courseAssignments.id}).from(courseAssignments).where(eq(courseAssignments.lessonId,courseLessons.id)))):undefined,
      query.flaggedVisibility==="HAS_FLAGGED"?exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.status,"PUBLISHED"),eq(lessonContents.visibleToStudents,true)))):
        query.flaggedVisibility==="NONE_FLAGGED"?not(exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.status,"PUBLISHED"),eq(lessonContents.visibleToStudents,true))))):undefined,
      query.publishedContent==="HAS_PUBLISHED"?exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.status,"PUBLISHED")))):
        query.publishedContent==="NONE_PUBLISHED"?not(exists(db.select({id:lessonContents.id}).from(lessonContents).where(and(eq(lessonContents.lessonId,courseLessons.id),eq(lessonContents.status,"PUBLISHED"))))):undefined,
      query.contentPresence&&query.contentPresence!=="ALL" ?
        (query.contentPresence==="HAS_CONTENT" ? exists(db.select({id:lessonContents.id}).from(lessonContents).where(eq(lessonContents.lessonId,courseLessons.id))) :
          not(exists(db.select({id:lessonContents.id}).from(lessonContents).where(eq(lessonContents.lessonId,courseLessons.id))))) : undefined,
      query.courseCode ? eq(courses.code,query.courseCode) : undefined,
      query.programCode ? eq(programs.code,query.programCode) : undefined,
      query.cohortCode ? eq(cohorts.code,query.cohortCode) : undefined,
      query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
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
    publishedVisible: sql<number>`count(*) filter (where ${lessonContents.status} = 'PUBLISHED' and ${lessonContents.visibleToStudents} = true)`.mapWith(Number),
  }).from(lessonContents)
    .where(inArray(lessonContents.lessonId, ids))
    .groupBy(lessonContents.lessonId);
  const byLesson = new Map(counts.map(r => [r.id, r]));
  const items: CollegeLessonRecord[] = baseRows.map(row => ({
    ...row,
    contentCount: byLesson.get(row.id)?.total ?? 0,
    publishedContentCount: byLesson.get(row.id)?.published ?? 0,
    publishedAndVisibleFlagCount: byLesson.get(row.id)?.publishedVisible ?? 0,
  }));
  const total = countRows[0]?.total ?? 0;
  return { kind: "LESSONS" as const, query, items, total, totalPages: collegeLearningPageCount(total) };
}

/** Recorded *content events* per offering, never attendance/quiz completion,
 * enrollment readiness or a percentage of eligible learners. */
export async function listCollegeCourseProgress(context: RequestContext, raw: unknown) {
  const query = collegeProgressQuerySchema.parse(raw);
  const collegeId = requireCollegeCoursesRead(context);
  const db = getDb();
  const persistedContentActivity=exists(db.select({id:learnerContentProgress.id}).from(learnerContentProgress)
    .innerJoin(lessonContents,eq(lessonContents.id,learnerContentProgress.lessonContentId))
    .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
    .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerContentProgress.membershipId),eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
    .where(eq(courseLearningPaths.offeringId,courseOfferings.id)));
  const completedContentActivity=exists(db.select({id:learnerContentProgress.id}).from(learnerContentProgress)
    .innerJoin(lessonContents,eq(lessonContents.id,learnerContentProgress.lessonContentId))
    .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
    .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerContentProgress.membershipId),eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
    .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),sql`${learnerContentProgress.completedAt} IS NOT NULL`)));
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
      query.offeringId?eq(courseOfferings.id,query.offeringId):undefined,
      query.sectionContentState==="HAS_SECTION"?exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),sql`${lessonContents.deliveryId} IS NOT NULL`))):query.sectionContentState==="NO_SECTION"?not(exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),sql`${lessonContents.deliveryId} IS NOT NULL`)))):undefined,
      query.sharedContentState==="HAS_SHARED"?exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),sql`${lessonContents.deliveryId} IS NULL`))):query.sharedContentState==="NO_SHARED"?not(exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),sql`${lessonContents.deliveryId} IS NULL`)))):undefined,
      query.hiddenContentState==="HAS_HIDDEN"?exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(lessonContents.status,"PUBLISHED"),eq(lessonContents.visibleToStudents,false)))):query.hiddenContentState==="NO_HIDDEN"?not(exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(lessonContents.status,"PUBLISHED"),eq(lessonContents.visibleToStudents,false))))):undefined,
      query.publishedContentState==="HAS_PUBLISHED"?exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(lessonContents.status,"PUBLISHED")))):query.publishedContentState==="NO_PUBLISHED"?not(exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(lessonContents.status,"PUBLISHED"))))):undefined,
      query.videoContentState==="HAS_VIDEO"?exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),inArray(lessonContents.contentType,["VIDEO","YOUTUBE"])))):query.videoContentState==="NO_VIDEO"?not(exists(db.select({id:lessonContents.id}).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),inArray(lessonContents.contentType,["VIDEO","YOUTUBE"]))))):undefined,
      query.liveClassPresence !== "ALL" ? (query.liveClassPresence === "HAS_LIVE" ? exists(db.select({id:lessonContents.id}).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(lessonContents.contentType,"LIVE_CLASS")))) : not(exists(db.select({id:lessonContents.id}).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(lessonContents.contentType,"LIVE_CLASS")))))) : undefined,
      query.resourcePresence !== "ALL" ? (query.resourcePresence === "HAS_RESOURCES" ? exists(db.select({id:lessonContents.id}).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(lessonContents.contentType,"RESOURCE")))) : not(exists(db.select({id:lessonContents.id}).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(lessonContents.contentType,"RESOURCE")))))) : undefined,
      query.quizPresence !== "ALL" ? (query.quizPresence === "HAS_QUIZZES" ? exists(db.select({id:courseQuizzes.id}).from(courseQuizzes)
        .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
        .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
        .where(eq(courseLearningPaths.offeringId,courseOfferings.id))) : not(exists(db.select({id:courseQuizzes.id}).from(courseQuizzes)
        .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
        .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
        .where(eq(courseLearningPaths.offeringId,courseOfferings.id))))) : undefined,
      query.assignmentPresence !== "ALL" ? (query.assignmentPresence === "HAS_ASSIGNMENTS" ? exists(db.select({id:courseAssignments.id}).from(courseAssignments)
        .innerJoin(courseLessons,eq(courseLessons.id,courseAssignments.lessonId))
        .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
        .where(eq(courseLearningPaths.offeringId,courseOfferings.id))) : not(exists(db.select({id:courseAssignments.id}).from(courseAssignments)
        .innerJoin(courseLessons,eq(courseLessons.id,courseAssignments.lessonId))
        .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
        .where(eq(courseLearningPaths.offeringId,courseOfferings.id))))) : undefined,
      query.lessonPresence !== "ALL" ? (query.lessonPresence === "HAS_LESSONS" ?
        exists(db.select({id:courseLessons.id}).from(courseLessons)
          .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
          .where(eq(courseLearningPaths.offeringId,courseOfferings.id))) :
        not(exists(db.select({id:courseLessons.id}).from(courseLessons)
          .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
          .where(eq(courseLearningPaths.offeringId,courseOfferings.id))))) : undefined,
      query.departmentCode ? eq(departments.name,query.departmentCode) : undefined,
      query.courseStatus !== "ALL" ? eq(courses.status,query.courseStatus) : undefined,
      query.periodStatus !== "ALL" ? eq(academicPeriods.status,query.periodStatus) : undefined,
      query.cohortStatus !== "ALL" ? eq(cohorts.status,query.cohortStatus) : undefined,
      query.programStatus !== "ALL" ? eq(programs.status,query.programStatus) : undefined,
      query.departmentName?eq(departments.name,query.departmentName):undefined,
      query.activityState==="RECORDED"?persistedContentActivity:
        query.activityState==="UNRECORDED"?not(persistedContentActivity):undefined,
      query.publishedPathPresence==="HAS_PUBLISHED_PATH"?exists(db.select({id:courseLearningPaths.id}).from(courseLearningPaths).where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(courseLearningPaths.status,"PUBLISHED")))):
        query.publishedPathPresence==="NO_PUBLISHED_PATH"?not(exists(db.select({id:courseLearningPaths.id}).from(courseLearningPaths).where(and(eq(courseLearningPaths.offeringId,courseOfferings.id),eq(courseLearningPaths.status,"PUBLISHED"))))):undefined,
      query.learningPathPresence==="HAS_PATH"?exists(db.select({id:courseLearningPaths.id}).from(courseLearningPaths).where(eq(courseLearningPaths.offeringId,courseOfferings.id))):
        query.learningPathPresence==="NO_PATH"?not(exists(db.select({id:courseLearningPaths.id}).from(courseLearningPaths).where(eq(courseLearningPaths.offeringId,courseOfferings.id)))):undefined,
      query.completionEvidence==="COMPLETED_CONTENT"?completedContentActivity:
        query.completionEvidence==="NO_COMPLETED_CONTENT"?not(completedContentActivity):undefined,
      query.offeringType&&query.offeringType!=="ALL"?eq(courseOfferings.type,query.offeringType):undefined,
      query.courseCode ? eq(courses.code,query.courseCode) : undefined,
      query.programCode ? eq(programs.code,query.programCode) : undefined,
      query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
      query.cohortCode ? eq(cohorts.code,query.cohortCode) : undefined,
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
