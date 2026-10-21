import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,colleges,departments,placementJobs,programs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {AuthorizationError} from "@/modules/permissions/policy";
export async function getSuperAdminHiringReportFilters(context:RequestContext){
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 // Every report facet depends on the same persisted parent college. Do not
 // expose titles from a chosen college with a contradictory selected org.
 const [college]=await db.select({id:colleges.id}).from(colleges)
  .where(and(eq(colleges.id,scope.collegeId),
   scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
  .limit(1);
 if(!college)throw new AuthorizationError("placements.read");
 const [jobsResult,deptsResult,progsResult,batchesResult]=await Promise.allSettled([
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
 const jobs=jobsResult.status==="fulfilled"?jobsResult.value:[];
 const depts=deptsResult.status==="fulfilled"?deptsResult.value:[];
 const progs=progsResult.status==="fulfilled"?progsResult.value:[];
 const batches=batchesResult.status==="fulfilled"?batchesResult.value:[];
 const failedFilters=[
  jobsResult.status==="rejected"?"jobs":null,
  deptsResult.status==="rejected"?"departments":null,
  progsResult.status==="rejected"?"programs":null,
  batchesResult.status==="rejected"?"batches":null,
 ].filter((name):name is string=>name!==null);
 const filtersError=failedFilters.length
  ?`Could not load ${failedFilters.join(", ")} for filtering. Those dropdowns are empty because the request failed, not because there is no data.`
  :null;
 return {jobs,departments:depts,programs:progs,batches,failedFilters,filtersError};
}
