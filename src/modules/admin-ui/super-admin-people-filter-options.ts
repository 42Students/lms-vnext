import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,colleges,departments,programs,sections} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
export async function getSuperAdminPeopleFilterOptions(context:RequestContext){
 const selected=requireSuperAdminSelectedCollege(context,"people.manage");
 const db=getDb(),collegeId=selected.collegeId;
 // A selected college may have a stale/mismatched organization cookie.
 // Do not disclose its department, program, cohort or class names unless
 // that college belongs to the selected organization in persisted data.
 const owner=and(eq(colleges.id,collegeId),
   selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined);
 const [dept,prog,batches,classes]=await Promise.all([
  db.select({id:departments.id,name:departments.name}).from(departments)
   .innerJoin(colleges,owner)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(departments.name)).limit(500),
  db.select({id:programs.id,name:programs.name}).from(programs)
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .innerJoin(colleges,owner)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(programs.name)).limit(1000),
  db.select({id:cohorts.id,name:cohorts.name}).from(cohorts)
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .innerJoin(colleges,owner)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(cohorts.name)).limit(2000),
  db.select({id:sections.id,name:sections.name}).from(sections)
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .innerJoin(colleges,owner)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(sections.name)).limit(2000),
 ]);
 return {departments:dept,programs:prog,batches,classes};
}
