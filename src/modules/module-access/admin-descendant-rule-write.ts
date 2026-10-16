import "server-only";
import {and,eq,inArray,isNull,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,moduleAccessRules} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {academicModuleRuleInput,descendantRuleMatches} from "./admin-descendant-rule-model";
import {StudentRuleConflict} from "./admin-student-rule-write";

const uuid=z.uuid();
type ScopeType="DEPARTMENT"|"PROGRAM"|"COHORT"|"SECTION";
type ScopeRow={id:string;name:string;departmentId:string;programId:string|null;cohortId:string|null};
function superAdmin(ctx:RequestContext){if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");requirePermission(ctx,"admin-scope.select");}
async function collegeScope(ctx:RequestContext,collegeInput:string){
 superAdmin(ctx);
 const collegeId=uuid.parse(collegeInput);
 const [college]=await getDb().select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
  .from(colleges).where(eq(colleges.id,collegeId)).limit(1);
 if(!college||college.status!=="ACTIVE")return null;
 requirePermission(ctx,"college.manage",{collegeId:college.id,organizationId:college.organizationId});
 return college;
}
async function resolveScope(db:ReturnType<typeof getDb>,collegeId:string,scopeType:ScopeType,scopeId:string):Promise<ScopeRow|null>{
 const rows=await db.execute<ScopeRow>(sql`
 with scopes as (
 select 'DEPARTMENT'::text as type,d.id,d.name,d.id as department_id,null::uuid as program_id,null::uuid as cohort_id,d.college_id from departments d
 union all select 'PROGRAM',p.id,p.name,d.id,p.id,null::uuid,d.college_id from programs p join departments d on d.id=p.department_id
 union all select 'COHORT',c.id,c.name,d.id,p.id,c.id,d.college_id from cohorts c join programs p on p.id=c.program_id join departments d on d.id=p.department_id
 union all select 'SECTION',s.id,s.name,d.id,p.id,c.id,d.college_id from sections s join cohorts c on c.id=s.cohort_id join programs p on p.id=c.program_id join departments d on d.id=p.department_id
 ) select id::text,name::text,"department_id"::text as "departmentId",
 "program_id"::text as "programId","cohort_id"::text as "cohortId"
 from scopes where type=${scopeType}::text and id=${scopeId}::uuid and college_id=${collegeId}::uuid limit 1
 `);
 return rows.rows[0]??null;
}
export type AcademicModuleScope={scopeType:ScopeType;scopeId:string;label:string;projectsRule:string;placementsRule:string;electivesRule:string};
export async function listCollegeModuleScopeChoices(ctx:RequestContext,collegeIdInput:string):Promise<AcademicModuleScope[]>{
 const college=await collegeScope(ctx,collegeIdInput);if(!college)return [];
 const result=await getDb().execute<{scopeType:ScopeType;scopeId:string;label:string}>(sql`
 select 'DEPARTMENT'::text as "scopeType", d.id::text as "scopeId",d.name::text as label
 from departments d where d.college_id=${college.id}::uuid
 union all select 'PROGRAM',p.id::text,(d.name||' / '||p.name)::text
 from programs p join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid
 union all select 'COHORT',c.id::text,(d.name||' / '||p.name||' / '||c.name)::text
 from cohorts c join programs p on p.id=c.program_id join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid
 union all select 'SECTION',s.id::text,(d.name||' / '||p.name||' / '||c.name||' / '||s.name)::text
 from sections s join cohorts c on c.id=s.cohort_id join programs p on p.id=c.program_id join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid
 order by "scopeType",label limit 500
 `);
 if(result.rows.length===0)return [];
 const ids=result.rows.map(row=>row.scopeId);
 const stored=await getDb().select({
  scopeType:moduleAccessRules.scopeType,scopeId:moduleAccessRules.scopeId,
  module:moduleAccessRules.module,enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked,
 }).from(moduleAccessRules).where(and(inArray(moduleAccessRules.scopeId,ids),
  inArray(moduleAccessRules.module,["projects","placements","electives"])));
 const describe=(scopeType:string,scopeId:string,module:string)=>{
  const entry=stored.find(row=>row.scopeType===scopeType&&row.scopeId===scopeId&&row.module===module);
  return entry?(entry.enabled?"On":"Off")+(entry.locked?" · Locked":""):"Inherit";
 };
 return result.rows.map(row=>({...row,projectsRule:describe(row.scopeType,row.scopeId,"projects"),
  placementsRule:describe(row.scopeType,row.scopeId,"placements"),electivesRule:describe(row.scopeType,row.scopeId,"electives")}));
}
export async function readDescendantRule(ctx:RequestContext,collegeInput:string,scopeType:ScopeType,scopeIdInput:string,module:"projects"|"electives"){
 const college=await collegeScope(ctx,collegeInput);if(!college)return null;
 const scopeId=uuid.parse(scopeIdInput);
 if(!await resolveScope(getDb(),college.id,scopeType,scopeId))return null;
 const [stored]=await getDb().select({enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked})
  .from(moduleAccessRules).where(and(eq(moduleAccessRules.scopeType,scopeType),eq(moduleAccessRules.scopeId,scopeId),eq(moduleAccessRules.module,module))).limit(1);
 return {scopeId,stored:stored??null};
}
export async function writeDescendantRule(ctx:RequestContext,collegeInput:string,raw:unknown){
 const input=academicModuleRuleInput.parse(raw),college=await collegeScope(ctx,collegeInput);
 if(!college)return null;
 return getDb().transaction(async tx=>{
  // Lock the college as the shared serialization point for descendants.
  const [lockedCollege]=await tx.select({id:colleges.id}).from(colleges)
   .where(and(eq(colleges.id,college.id),eq(colleges.status,"ACTIVE"))).for("update").limit(1);
  if(!lockedCollege)return null;
  const scope=await resolveScope(tx as ReturnType<typeof getDb>,college.id,input.scopeType,input.scopeId);
  if(!scope)return null;
  const predicate=and(eq(moduleAccessRules.scopeType,input.scopeType),eq(moduleAccessRules.scopeId,input.scopeId),eq(moduleAccessRules.module,input.module));
  const [previous]=await tx.select({id:moduleAccessRules.id,enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked})
   .from(moduleAccessRules).where(predicate).for("update").limit(1);
  const before=previous?{enabled:previous.enabled,locked:previous.locked}:null;
  if(!descendantRuleMatches(input.expected,before))throw new StudentRuleConflict("STALE_RULE");
  if(input.action==="SET"){
   const ancestorIds=[{type:"GLOBAL",id:null},{type:"ORGANIZATION",id:college.organizationId},
    {type:"COLLEGE",id:college.id},
    ...(input.scopeType!=="DEPARTMENT"?[{type:"DEPARTMENT",id:scope.departmentId}]:[]),
    ...(input.scopeType==="COHORT"||input.scopeType==="SECTION"?[{type:"PROGRAM",id:scope.programId}]:[]),
    ...(input.scopeType==="SECTION"?[{type:"COHORT",id:scope.cohortId}]:[])];
   const locks=await tx.select({locked:moduleAccessRules.locked}).from(moduleAccessRules)
    .where(and(eq(moduleAccessRules.module,input.module),
     or(...ancestorIds.map(a=>and(eq(moduleAccessRules.scopeType,a.type),a.id===null?isNull(moduleAccessRules.scopeId):eq(moduleAccessRules.scopeId,a.id!)))))).for("share");
   if(locks.some(row=>row.locked))throw new StudentRuleConflict("ANCESTOR_LOCKED");
  }
  if(input.action==="INHERIT"){
   if(previous)await tx.delete(moduleAccessRules).where(eq(moduleAccessRules.id,previous.id));
  }else if(previous){
   await tx.update(moduleAccessRules).set({enabled:input.enabled!,locked:input.locked!,updatedByUserId:ctx.user.id,updatedAt:new Date()})
    .where(eq(moduleAccessRules.id,previous.id));
  }else{
   await tx.insert(moduleAccessRules).values({scopeType:input.scopeType,scopeId:input.scopeId,module:input.module,
    enabled:input.enabled!,locked:input.locked!,updatedByUserId:ctx.user.id});
  }
  await tx.insert(activityEvents).values({collegeId:college.id,organizationId:college.organizationId,actorUserId:ctx.user.id,
   module:"PLATFORM",eventType:"PLATFORM_DESCENDANT_MODULE_RULE_CHANGED",importance:"HIGH",
   subjectType:input.scopeType,subjectId:input.scopeId,
   summary:"Super Admin changed an academic module rule",
   metadata:{module:input.module,before,after:input.action==="INHERIT"?null:{enabled:input.enabled,locked:input.locked}},
  });
  return {scopeType:input.scopeType,scopeId:input.scopeId,module:input.module,
   stored:input.action==="INHERIT"?null:{enabled:input.enabled,locked:input.locked}};
 });
}
