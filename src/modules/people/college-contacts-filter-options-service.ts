import "server-only";
import {and,asc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,programs,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
/** Current-college names only: never trust caller-supplied college scopes. */
export async function listCollegeContactFilterOptions(context:RequestContext){
 const actor=context.membership;
 if(context.user.platformStatus!=="ACTIVE"||!actor||actor.status!=="ACTIVE"||!actor.roles.includes("COLLEGE_ADMIN"))
  throw new AuthorizationError("people.manage");
 return getDb().transaction(async tx=>{
  const checked=await assertPersistedPlatformPermission(tx,context,"people.manage",{
   collegeId:actor.collegeId,organizationId:actor.organizationId,
  });
  if(!checked.membership||checked.membership.id!==actor.id||!checked.membership.roles.includes("COLLEGE_ADMIN")||
   checked.membership.collegeId!==actor.collegeId)
   throw new AuthorizationError("people.manage");
  const cohortRows=await tx.select({id:cohorts.id,name:cohorts.name,programName:programs.name})
   .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,actor.collegeId)))
   .orderBy(asc(programs.name),asc(cohorts.name),asc(cohorts.id)).limit(201);
  const departmentRows=await tx.select({id:departments.id,name:departments.name})
   .from(departments).where(and(eq(departments.collegeId,actor.collegeId),isNull(departments.archivedAt)))
   .orderBy(asc(departments.name),asc(departments.id)).limit(201);
  return {departments:departmentRows.slice(0,200).map(r=>({id:r.id,label:r.name})),
   departmentsTruncated:departmentRows.length>200,
   cohorts:cohortRows.slice(0,200).map(r=>({id:r.id,label:r.programName+" · "+r.name})),
   cohortsTruncated:cohortRows.length>200};
 });
}
