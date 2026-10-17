import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,departments,placementJobs,programs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
export async function getSuperAdminHiringReportFilters(context:RequestContext){
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const [jobs,depts,progs,batches]=await Promise.all([
  db.select({id:placementJobs.id,name:placementJobs.title}).from(placementJobs)
   .where(eq(placementJobs.collegeId,scope.collegeId)).orderBy(asc(placementJobs.title)).limit(2000),
  db.select({id:departments.id,name:departments.name}).from(departments)
   .where(eq(departments.collegeId,scope.collegeId)).orderBy(asc(departments.name)).limit(1000),
  db.select({id:programs.id,name:programs.name}).from(programs)
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .where(eq(departments.collegeId,scope.collegeId)).orderBy(asc(programs.name)).limit(1000),
  db.select({id:cohorts.id,name:cohorts.name}).from(cohorts)
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .where(eq(departments.collegeId,scope.collegeId)).orderBy(asc(cohorts.name)).limit(2000),
 ]);
 return {jobs,departments:depts,programs:progs,batches};
}
