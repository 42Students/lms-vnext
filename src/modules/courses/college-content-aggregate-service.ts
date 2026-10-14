import "server-only";

import { and, asc, count, eq, ilike, inArray, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
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
  const query = collegeContentQuerySchema.parse(rawQuery);
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
    id: lessonContents.id,
    title: lessonContents.title,
    contentType: lessonContents.contentType,
    status: lessonContents.status,
    sequence: lessonContents.sequence,
    durationSeconds: lessonContents.durationSeconds,
    deliveryId: lessonContents.deliveryId,
    lessonName: courseLessons.name,
    learningPathTitle: courseLearningPaths.title,
    learningPathStatus: courseLearningPaths.status,
    offeringId: courseOfferings.id,
    offeringStatus: courseOfferings.status,
    courseName: courses.name,
    courseCode: courses.code,
    cohortName: cohorts.name,
    periodName: academicPeriods.name,
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
      inArray(lessonContents.contentType, [...collegeContentTypes(kind)]),
      query.status === "ALL" ? undefined : eq(lessonContents.status, query.status),
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
    kind, query, items, total,
    totalPages: collegeContentPageCount(total),
  };
}
