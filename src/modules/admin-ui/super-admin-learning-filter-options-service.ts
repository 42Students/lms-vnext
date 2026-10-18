import "server-only";
import {asc,and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courses,departments,programs,cohorts} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
export async function getSuperAdminLearningFilterOptions(context:RequestContext){
 if(!isSuperAdmin(context))throw new AuthorizationError("courses.read");
 const collegeId=(await resolveActingCollege(context,"courses.read")).collegeId;
 const db=getDb();
 const [courseRows,cohortRows]=await Promise.all([
  db.select({code:courses.code,name:courses.name}).from(courses)
   .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
   .orderBy(asc(courses.name),asc(courses.code)).limit(2000),
  db.select({code:cohorts.code,name:cohorts.name,programName:programs.name}).from(cohorts)
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
   .orderBy(asc(cohorts.name),asc(cohorts.code)).limit(2000),
 ]);
 return {courses:courseRows,cohorts:cohortRows};
}
