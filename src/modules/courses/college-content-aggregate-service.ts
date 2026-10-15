import "server-only";

import { and, asc, count, eq, gte, ilike, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { aliasedColumn } from "@/db/aliased-column";
import {
  academicPeriods,
  cohorts,
  courseLearningPaths,
  courseLessons,
  courseOfferings,
  courses,
  departments,
  lessonContents,
  programs,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_CONTENT_PAGE_SIZE,
  collegeContentPageCount,
  collegeContentQuerySchema,
  collegeContentTypes,
  type CollegeContentKind,
} from "./college-content-aggregate-model";

import {collegeLiveClassQuerySchema,istDayBoundary} from "./college-live-classes-model";
const programDepartment = alias(departments, "content_program_department");

/**
 * College ownership is anchored independently at course department, cohort
 * program department, and academic period. Storage keys and external URLs are
 * intentionally never selected by these management aggregates.
 */
export async function listCollegeContentAggregate(
  context: RequestContext,
  kind: CollegeContentKind,
  rawQuery: unknown,
) {
  const live = kind === "LIVE_CLASS" ? collegeLiveClassQuerySchema.parse(rawQuery) : null;
  const query = collegeContentQuerySchema.parse(live ? {
    q:live.q,courseCode:live.courseCode,status:live.status,scope:live.scope,page:live.page,format:"ALL",visibility:"ALL",
  } : rawQuery);
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "courses.read", {
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
      })) {
    throw new AuthorizationError("courses.read");
  }
  const collegeId = membership.collegeId;
  requirePermission(context, "courses.read", {
    collegeId,
    organizationId: membership.organizationId,
  });

  const db = getDb();
  const scoped = db.select({
    id: aliasedColumn(lessonContents.id, "content_id"),
    title: aliasedColumn(lessonContents.title, "content_title"),
    contentType: aliasedColumn(lessonContents.contentType, "content_content_type"),
    status: aliasedColumn(lessonContents.status, "content_status"),
    sequence: aliasedColumn(lessonContents.sequence, "content_sequence"),
    durationSeconds: aliasedColumn(lessonContents.durationSeconds, "content_duration_seconds"),
    deliveryId: aliasedColumn(lessonContents.deliveryId, "content_delivery_id"),
    visibleToStudents: aliasedColumn(lessonContents.visibleToStudents, "content_visible_to_students"),
    lessonName: aliasedColumn(courseLessons.name, "content_lesson_name"),
    learningPathTitle: aliasedColumn(courseLearningPaths.title, "content_learning_path_title"),
    learningPathStatus: aliasedColumn(courseLearningPaths.status, "content_learning_path_status"),
    offeringId: aliasedColumn(courseOfferings.id, "content_offering_id"),
    offeringStatus: aliasedColumn(courseOfferings.status, "content_offering_status"),
    courseName: aliasedColumn(courses.name, "content_course_name"),
    courseCode: aliasedColumn(courses.code, "content_course_code"),
    cohortName: aliasedColumn(cohorts.name, "content_cohort_name"),
    periodName: aliasedColumn(academicPeriods.name, "content_period_name"),
    startsAt: aliasedColumn(lessonContents.startsAt,"content_starts_at"),
    endsAt: aliasedColumn(lessonContents.endsAt,"content_ends_at"),
  }).from(lessonContents)
    .innerJoin(courseLessons, eq(courseLessons.id, lessonContents.lessonId))
    .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
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
      inArray(lessonContents.contentType,
        kind === "VIDEO" && query.format !== "ALL" ? [query.format] : [...collegeContentTypes(kind)]),
      query.status === "ALL" ? undefined : eq(lessonContents.status, query.status),
      kind !== "LIVE_CLASS" && query.offeringStatus && query.offeringStatus !== "ALL"
        ? eq(courseOfferings.status,query.offeringStatus) : undefined,
      query.courseCode ? eq(courses.code, query.courseCode) : undefined,
      kind !== "LIVE_CLASS" && query.programCode ? eq(programs.code,query.programCode) : undefined,
      kind !== "LIVE_CLASS" && query.visibility !== "ALL" ? eq(lessonContents.visibleToStudents,query.visibility === "VISIBLE") : undefined,
      query.scope === "SHARED" ? isNull(lessonContents.deliveryId) : undefined,
      query.scope === "SECTION" ? isNotNull(lessonContents.deliveryId) : undefined,
      live?.view === "UPCOMING" ? gte(lessonContents.endsAt,new Date()) : undefined,
      live?.view === "PAST" ? lt(lessonContents.endsAt,new Date()) : undefined,
      live?.from ? gte(lessonContents.endsAt,istDayBoundary(live.from)) : undefined,
      live?.to ? lt(lessonContents.startsAt,istDayBoundary(live.to,true)) : undefined,
      query.q ? or(
        ilike(lessonContents.title, "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%"),
        ilike(courseLessons.name, "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%"),
        ilike(courses.name, "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%"),
      ) : undefined,
    )).as("college_content_aggregate");

  const [counts, items] = await Promise.all([
    db.select({ total: count() }).from(scoped),
    db.select().from(scoped)
      .orderBy(asc(scoped.courseName), asc(scoped.lessonName), asc(scoped.sequence), asc(scoped.id))
      .limit(COLLEGE_CONTENT_PAGE_SIZE)
      .offset((query.page - 1) * COLLEGE_CONTENT_PAGE_SIZE),
  ]);
  const total = counts[0]?.total ?? 0;
  return {
    kind, query, view:live?.view??"ALL", from:live?.from, to:live?.to, items, total,
    totalPages: collegeContentPageCount(total),
  };
}
