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
  db.select({id:programs.id,name:programs.name,departmentId:programs.departmentId}).from(programs)
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .innerJoin(colleges,owner)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(programs.name)).limit(1000),
  db.select({id:cohorts.id,name:cohorts.name,programId:cohorts.programId}).from(cohorts)
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .innerJoin(colleges,owner)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(cohorts.name)).limit(2000),
  db.select({id:sections.id,name:sections.name,cohortId:sections.cohortId}).from(sections)
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .innerJoin(colleges,owner)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(sections.name)).limit(2000),
 ]);
 return {departments:dept,programs:prog,batches,classes};
}

/** Safe dependent filter cascade. A stale parent selection clears all
 * child selections before issuing a new tenant-scoped directory query. */
export function projectSuperAdminPeopleFilterCascade(input:{
 programs:readonly {id:string}[];
 batches:readonly {id:string;programId:string}[];
 classes:readonly {id:string;cohortId:string}[];
 programId:string|null;
 batchId:string|null;
 classId:string|null;
}){
 const programId=input.programId&&input.programs.some(p=>p.id===input.programId)
  ?input.programId:null;
 const batches=programId?input.batches.filter(row=>row.programId===programId):input.batches;
 const batchId=input.batchId&&batches.some(row=>row.id===input.batchId)?input.batchId:null;
 const classes=batchId?input.classes.filter(row=>row.cohortId===batchId):input.classes;
 const classId=input.classId&&classes.some(row=>row.id===input.classId)?input.classId:null;
 return {programId,batchId,classId,batches,classes};
}
