import "server-only";
import {and,asc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,programs,departments,sections} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegeVerificationActor} from "./staff-auth";
import type {VerificationFilterChoiceList} from "./filter-options-model";
/** Scoped roster choices, never caller-supplied college IDs. */
export async function listVerificationBatchOptions(context:RequestContext):Promise<VerificationFilterChoiceList>{
 const scope=await requireCollegeVerificationActor(context);
 const rows=await getDb().select({id:cohorts.id,name:cohorts.name,program:programs.name})
  .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))
  .orderBy(asc(programs.name),asc(cohorts.name),asc(cohorts.id)).limit(201);
 return {items:rows.slice(0,200).map(r=>({id:r.id,label:r.program+" · "+r.name})),truncated:rows.length>200};
}

export async function listVerificationBranchOptions(context:RequestContext):Promise<VerificationFilterChoiceList>{
 const scope=await requireCollegeVerificationActor(context);
 const rows=await getDb().select({id:departments.id,name:departments.name})
  .from(departments).where(and(eq(departments.collegeId,scope.collegeId),isNull(departments.archivedAt)))
  .orderBy(asc(departments.name),asc(departments.id)).limit(201);
 return {items:rows.slice(0,200).map(r=>({id:r.id,label:r.name})),truncated:rows.length>200};
}

export async function listVerificationClassOptions(context:RequestContext):Promise<VerificationFilterChoiceList>{
 const scope=await requireCollegeVerificationActor(context);
 const rows=await getDb().select({id:sections.id,sectionName:sections.name,cohortName:cohorts.name})
  .from(sections).innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))
  .where(eq(sections.status,"ACTIVE"))
  .orderBy(asc(cohorts.name),asc(sections.name),asc(sections.id)).limit(201);
 return {items:rows.slice(0,200).map(r=>({id:r.id,label:r.cohortName+" · "+r.sectionName})),truncated:rows.length>200};
}

/** Up to 200 persisted programs in the actor's current college; no supplied tenant scope. */
export async function listVerificationProgramOptions(context:RequestContext):Promise<VerificationFilterChoiceList>{
 const scope=await requireCollegeVerificationActor(context);
 const rows=await getDb().select({id:programs.id,name:programs.name})
  .from(programs).innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))
  .orderBy(asc(programs.name),asc(programs.id)).limit(201);
 return {items:rows.slice(0,200).map(r=>({id:r.id,label:r.name})),truncated:rows.length>200};
}
