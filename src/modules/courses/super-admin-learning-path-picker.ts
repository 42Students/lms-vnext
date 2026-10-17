import "server-only";
import {and,asc,eq,ne} from "drizzle-orm";
import {getDb} from "@/db/client";
import {academicPeriods,cohorts,courseLearningPaths,courseOfferings,courses,departments} from "@/db/schema";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import type {RequestContext} from "@/modules/identity/context";
/** SA-academics-people-56: includes empty offering paths, not only those with lessons. */
export async function listSuperAdminLearningPathPicker(context:RequestContext){
 const acting=await resolveActingCollege(context,"courses.manage");
 return getDb().select({
  id:courseLearningPaths.id,courseName:courses.name,
  cohortName:cohorts.name,periodName:academicPeriods.name,
 }).from(courseLearningPaths)
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),
   eq(departments.collegeId,acting.collegeId)))
  .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
  .innerJoin(academicPeriods,eq(academicPeriods.id,courseOfferings.academicPeriodId))
  .where(and(eq(courseOfferings.status,"ACTIVE"),eq(courses.status,"ACTIVE"),
   ne(courseLearningPaths.status,"ARCHIVED"),
   eq(academicPeriods.collegeId,acting.collegeId)))
  .orderBy(asc(courses.name),asc(cohorts.name),asc(academicPeriods.name))
  .limit(1000);
}
