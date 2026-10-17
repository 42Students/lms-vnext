import "server-only";
import {and,countDistinct,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseLessons,courseLearningPaths,courseOfferings,courses,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";

/** SA-academics-people-74: dependency counts are scoped to one selected college. */
export async function getSuperAdminCourseDependencyCounts(context:RequestContext){
 const selected=requireSuperAdminSelectedCollege(context,"courses.read");
 const rows=await getDb().select({
  courseId:courses.id,
  lessonCount:countDistinct(courseLessons.id),
 }).from(courses)
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,selected.collegeId)))
  .leftJoin(courseOfferings,eq(courseOfferings.courseId,courses.id))
  .leftJoin(courseLearningPaths,eq(courseLearningPaths.offeringId,courseOfferings.id))
  .leftJoin(courseLessons,eq(courseLessons.learningPathId,courseLearningPaths.id))
  .groupBy(courses.id);
 return Object.fromEntries(rows.map(row=>[row.courseId,row.lessonCount])) as Record<string,number>;
}
