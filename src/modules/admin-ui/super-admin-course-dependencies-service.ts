import "server-only";
import {and,countDistinct,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseLessons,courseLearningPaths,courseOfferings,courses,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";

/** SA-academics-people-74: dependency counts are scoped to one selected college. */
export async function getSuperAdminCourseDependencyCounts(context:RequestContext,visibleCourseIds:readonly string[]){
 const courseIds=z.array(z.uuid()).max(100).parse(visibleCourseIds);
 const selected=requireSuperAdminSelectedCollege(context,"courses.read");
 if(courseIds.length===0){
  const emptyCounts:Record<string,number>={};
  return emptyCounts;
 }
 const rows=await getDb().select({
  courseId:courses.id,
  lessonCount:countDistinct(courseLessons.id),
 }).from(courses)
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,selected.collegeId)))
  .leftJoin(courseOfferings,eq(courseOfferings.courseId,courses.id))
  .leftJoin(courseLearningPaths,eq(courseLearningPaths.offeringId,courseOfferings.id))
  .leftJoin(courseLessons,eq(courseLessons.learningPathId,courseLearningPaths.id))
  .where(inArray(courses.id,courseIds))
  .groupBy(courses.id);
 return Object.fromEntries(rows.map(row=>[row.courseId,row.lessonCount])) as Record<string,number>;
}
