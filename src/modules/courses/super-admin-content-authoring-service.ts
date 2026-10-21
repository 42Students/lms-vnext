import "server-only";

import { and, asc, eq, ilike, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courseLearningPaths, courseLessons, courseOfferings, courses, departments, lessonContents } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";

/** The authoring picker is restricted to persisted lessons of the selected college. */
export async function listSuperAdminContentAuthoringLessons(
  context: RequestContext,
  options: { search?: string; page?: number; pageSize?: number } = {},
) {
  const search = (options.search ?? "").trim().slice(0, 100);
  const page = typeof options.page === "number" && Number.isSafeInteger(options.page) && options.page > 0
    ? Math.min(options.page, 10000) : 1;
  const pageSize = typeof options.pageSize === "number" && Number.isSafeInteger(options.pageSize) && options.pageSize > 0
    ? Math.min(options.pageSize, 500) : 500;
  // Escape SQL LIKE wildcard characters without broadening the search.
  const pattern = "%" + search.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_") + "%";
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
      eq(courseLessons.status,"ACTIVE"),ne(courseLearningPaths.status,"ARCHIVED"),
      ...(search ? [ilike(courseLessons.name, pattern)] : [])))
    .orderBy(asc(courses.name), asc(courseLessons.name), asc(courseLessons.id))
    .limit(pageSize).offset((page - 1) * pageSize);
}

/** Old lesson authoring starts at sequence zero and permits an explicit
 * zero-point item. The new DB sequence is also zero-based; points default to
 * one only when omitted, never when a valid zero is submitted. */
export function legacyLessonContentDefaults(
 input:{sequence?:number|null;points?:number|null},
){
 const sequence=input.sequence??0,points=input.points??1;
 if(!Number.isSafeInteger(sequence)||sequence<0)
  throw new Error("Sequence must be zero or greater");
 if(!Number.isSafeInteger(points)||points<0||points>1000)
  throw new Error("Points must be between 0 and 1000");
 return {sequence,points};
}
