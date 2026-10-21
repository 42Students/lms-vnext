import "server-only";
import {and,eq,inArray,isNull,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {activityEvents,colleges,moduleAccessRules} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {academicModuleRuleInput,descendantRuleMatches,academicScopeStudents} from "./admin-descendant-rule-model";
import {StudentRuleConflict} from "./admin-student-rule-write";
import {resolveModuleAccessFromRules,type ModuleAccessRule,type ModuleAccessScope} from "./service";

const uuid=z.uuid();
type ScopeType="DEPARTMENT"|"PROGRAM"|"COHORT"|"SECTION";
/** The legacy Batch/Class labels are display aliases, not new DB scopes. */
export function legacyModuleScopeType(value:string):ScopeType|null{
 const code=value.trim().toUpperCase();
 if(code==="BATCH"||code==="COHORT")return "COHORT";
 if(code==="CLASS"||code==="SECTION")return "SECTION";
 return code==="DEPARTMENT"||code==="PROGRAM"?code:null;
}
export function legacyModuleScopeLabel(type:ScopeType){
 return type==="COHORT"?"Batch":type==="SECTION"?"Class":
  type==="DEPARTMENT"?"Department":"Program";
}
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
async function resolveScope(db:Pick<ReturnType<typeof getDb>,"execute">,collegeId:string,scopeType:ScopeType,scopeId:string):Promise<ScopeRow|null>{
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
export type AcademicModuleScope={scopeType:ScopeType;scopeId:string;label:string;
 projectsRule:string;placementsRule:string;electivesRule:string;studentsInScope:number;
 projectsEffective:string;placementsEffective:string;electivesEffective:string;
 projectsShadowed:boolean;placementsShadowed:boolean;electivesShadowed:boolean;
};
/** Active learners only, deduplicated by membership; completed/withdrawn
 * enrollments and foreign-college sections cannot inflate the tree. */
export async function listCollegeModuleScopeChoices(ctx:RequestContext,collegeIdInput:string,page=1):Promise<AcademicModuleScope[]>{
 const safePage=Number.isSafeInteger(page)?Math.max(1,Math.min(page,10000)):1;
 const college=await collegeScope(ctx,collegeIdInput);if(!college)return [];
 const result=await getDb().execute<{scopeType:ScopeType;scopeId:string;label:string;departmentId:string|null;programId:string|null;cohortId:string|null}>(sql`
 select 'DEPARTMENT'::text as "scopeType", d.id::text as "scopeId",d.name::text as label,
  d.id::text as "departmentId",null::text as "programId",null::text as "cohortId"
 from departments d where d.college_id=${college.id}::uuid
 union all select 'PROGRAM',p.id::text,(d.name||' / '||p.name)::text,d.id::text,p.id::text,null::text
 from programs p join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid
 union all select 'COHORT',c.id::text,(d.name||' / '||p.name||' / '||c.name)::text,d.id::text,p.id::text,c.id::text
 from cohorts c join programs p on p.id=c.program_id join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid
 union all select 'SECTION',s.id::text,(d.name||' / '||p.name||' / '||c.name||' / '||s.name)::text,d.id::text,p.id::text,c.id::text
 from sections s join cohorts c on c.id=s.cohort_id join programs p on p.id=c.program_id join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid
 order by "scopeType",label limit 500 offset ${(safePage-1)*500}
 `);
 if(result.rows.length===0)return [];
 const ids=[...new Set([
  college.id,college.organizationId,...result.rows.flatMap(row=>
   [row.scopeId,row.departmentId,row.programId,row.cohortId].filter((x):x is string=>x!==null)),
 ])];
 const stored=await getDb().select({
  scopeType:moduleAccessRules.scopeType,scopeId:moduleAccessRules.scopeId,
  module:moduleAccessRules.module,enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked,
 }).from(moduleAccessRules).where(and(or(isNull(moduleAccessRules.scopeId),inArray(moduleAccessRules.scopeId,ids)),
  inArray(moduleAccessRules.module,["projects","placements","electives"])));
 const studentRows=await getDb().execute<{scopeType:ScopeType;scopeId:string;studentsInScope:number}>(sql`
 WITH active AS (
  SELECT enrollment.id AS enrollment_id,enrollment.membership_id AS member_id,
   enrollment.program_id,enrollment.cohort_id,program.department_id
  FROM learner_program_enrollments enrollment
  JOIN college_memberships membership ON membership.id=enrollment.membership_id
  JOIN users person ON person.id=membership.user_id
  JOIN membership_roles role ON role.membership_id=membership.id AND role.role='LEARNER'
  JOIN programs program ON program.id=enrollment.program_id
  JOIN departments department ON department.id=program.department_id
  WHERE enrollment.status='ACTIVE' AND membership.status='ACTIVE'
   AND person.platform_status='ACTIVE' AND membership.college_id=${college.id}::uuid
   AND department.college_id=${college.id}::uuid
 ), scoped AS (
  SELECT 'DEPARTMENT'::text AS scope_type,department_id AS scope_id,member_id FROM active
  UNION ALL SELECT 'PROGRAM',program_id,member_id FROM active
  UNION ALL SELECT 'COHORT',cohort_id,member_id FROM active
  UNION ALL SELECT 'SECTION',section_enrollment.section_id,active.member_id
   FROM active
   JOIN section_enrollments section_enrollment
     ON section_enrollment.learner_enrollment_id=active.enrollment_id
     AND section_enrollment.status='ACTIVE'
   JOIN sections section ON section.id=section_enrollment.section_id
     AND section.cohort_id=active.cohort_id AND section.status='ACTIVE'
 )
 SELECT scope_type AS "scopeType",scope_id::text AS "scopeId",
  count(DISTINCT member_id)::int AS "studentsInScope"
 FROM scoped GROUP BY scope_type,scope_id
 `);
 const students=academicScopeStudents(studentRows.rows);
 const describe=(scopeType:string,scopeId:string,module:string)=>{
  const entry=stored.find(row=>row.scopeType===scopeType&&row.scopeId===scopeId&&row.module===module);
  return entry?(entry.enabled?"On":"Off")+(entry.locked?" · Locked":""):"Inherit";
 };
 return result.rows.map(row=>{
  const chain:ModuleAccessScope[]=[
   {scopeType:row.scopeType,scopeId:row.scopeId},
   ...(row.scopeType==="SECTION"&&row.cohortId?[{scopeType:"COHORT" as const,scopeId:row.cohortId}]:[]),
   ...((row.scopeType==="SECTION"||row.scopeType==="COHORT")&&row.programId?
     [{scopeType:"PROGRAM" as const,scopeId:row.programId}]:[]),
   ...(row.scopeType!=="DEPARTMENT"&&row.departmentId?
     [{scopeType:"DEPARTMENT" as const,scopeId:row.departmentId}]:[]),
   {scopeType:"COLLEGE",scopeId:college.id},
   {scopeType:"ORGANIZATION",scopeId:college.organizationId},
   {scopeType:"GLOBAL",scopeId:null},
  ];
  const decision=resolveModuleAccessFromRules(chain,stored as ModuleAccessRule[]);
  const effective=(module:"projects"|"placements"|"electives")=>
   (decision[module].enabled?"On":"Off")+" · "+decision[module].level;
  const shadowed=(module:"projects"|"placements"|"electives")=>
   describe(row.scopeType,row.scopeId,module)!=="Inherit"&&decision[module].scopeId!==row.scopeId;
  return {...row,projectsRule:describe(row.scopeType,row.scopeId,"projects"),
   placementsRule:describe(row.scopeType,row.scopeId,"placements"),
   electivesRule:describe(row.scopeType,row.scopeId,"electives"),
   projectsEffective:effective("projects"),placementsEffective:effective("placements"),
   electivesEffective:effective("electives"),
   projectsShadowed:shadowed("projects"),placementsShadowed:shadowed("placements"),
   electivesShadowed:shadowed("electives"),
   studentsInScope:students.get(row.scopeType+":"+row.scopeId)??0};
 });
}
/** Full, independently scoped inventory count for paged/virtualized trees.
 * The list keeps its bounded 500-row read; the caller uses hasMore rather
 * than silently assuming page one is the complete college hierarchy. */
export async function listCollegeModuleScopePage(
 ctx:RequestContext,collegeIdInput:string,page=1,
){
 const safePage=Number.isSafeInteger(page)?Math.max(1,Math.min(page,10000)):1;
 const college=await collegeScope(ctx,collegeIdInput);
 if(!college)return {items:[] as AcademicModuleScope[],page:safePage,total:0,totalPages:0,hasMore:false};
 const [result,items]=await Promise.all([
  getDb().execute<{total:number}>(sql`select (
   (select count(*) from departments d where d.college_id=${college.id}::uuid)+
   (select count(*) from programs p join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid)+
   (select count(*) from cohorts c join programs p on p.id=c.program_id join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid)+
   (select count(*) from sections s join cohorts c on c.id=s.cohort_id join programs p on p.id=c.program_id join departments d on d.id=p.department_id where d.college_id=${college.id}::uuid)
  )::integer as total`),
  listCollegeModuleScopeChoices(ctx,college.id,safePage),
 ]);
 const total=Number(result.rows[0]?.total??0);
 return {items,page:safePage,total,totalPages:Math.ceil(total/500),hasMore:safePage*500<total};
}

export async function readDescendantRule(ctx:RequestContext,collegeInput:string,scopeType:ScopeType,scopeIdInput:string,module:"projects"|"placements"|"electives"){
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
  await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const scope=await resolveScope(tx,college.id,input.scopeType,input.scopeId);
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
