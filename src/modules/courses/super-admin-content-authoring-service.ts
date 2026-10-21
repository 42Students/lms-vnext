import "server-only";

import { and, asc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courseLearningPaths, courseLessons, courseOfferings, courses, departments, lessonContents } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";

/** The authoring picker is restricted to persisted lessons of the selected college. */
export async function listSuperAdminContentAuthoringLessons(context: RequestContext) {
  const acting = await resolveActingCollege(context, "courses.manage");
  return getDb().select({
    id: courseLessons.id,
    name: courseLessons.name,
    courseName: courses.name,
    courseCode: courses.code,
    offeringId: courseOfferings.id,
    nextContentSequence: sql<number>`coalesce((select max(lc.sequence)+1 from lesson_contents lc where lc.lesson_id = ${courseLessons.id} and lc.delivery_id is null),0)::int`,
  }).from(courseLessons)
    .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .where(and(eq(departments.collegeId, acting.collegeId),
      eq(courses.status,"ACTIVE"),eq(courseOfferings.status,"ACTIVE"),
      eq(courseLessons.status,"ACTIVE"),ne(courseLearningPaths.status,"ARCHIVED")))
    .orderBy(asc(courses.name), asc(courseLessons.name), asc(courseLessons.id))
    .limit(500);
}
