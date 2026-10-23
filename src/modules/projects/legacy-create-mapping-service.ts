import "server-only";
import {and,eq,inArray,isNull,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,legacyIdMap,membershipRoles,
  projectTemplates,projectTemplateCollegeAssignments,
  cohorts,programs,departments,sections,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {loadProjectCollegeScope} from "./scope";
import {ProjectsServiceError} from "./errors";

/** Preflight a historical AdminProjectCreateDTO without changing the vNext
 * template/version + membership model. A legacy manual workspace cannot be
 * persisted with a null template FK; it needs a published seed template.
 * Numeric IDs are resolved only against a verified college import crosswalk.
 */
export type LegacyProjectCreateIds={
 collegeId:string;templateId:number;classId?:number|null;
 mentorId?:number|null;learnerIds:readonly number[];
};
type Kind="template"|"section"|"mentor"|"learner";
const validId=(value:number)=>Number.isSafeInteger(value)&&value>0&&value<=2147483647;
const sourceTypes:Record<Kind,readonly string[]>={
 template:["project_template","template"],section:["class","section"],
 mentor:["mentor","faculty","teacher"],learner:["student","learner"],
};
const destinationTypes:Record<Kind,readonly string[]>={
 template:["project_template","template"],section:["section","class"],
 mentor:["college_membership","membership"],learner:["college_membership","membership"],
};
export async function preflightLegacyProjectCreateIds(
 context:RequestContext,raw:LegacyProjectCreateIds,
){
 if(!validId(raw.templateId)||(raw.classId!=null&&!validId(raw.classId))||
    (raw.mentorId!=null&&!validId(raw.mentorId))||
    raw.learnerIds.length>500||raw.learnerIds.some(id=>!validId(id))||
    new Set(raw.learnerIds).size!==raw.learnerIds.length)
   throw new ProjectsServiceError("PROJECT_INVALID_STATE");
 const college=await loadProjectCollegeScope(raw.collegeId);
 if((context.adminScope?.collegeId&&context.adminScope.collegeId!==college.id)||
    (context.membership&&context.membership.collegeId!==college.id))
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 requirePermission(context,"projects.manage",{
  collegeId:college.id,organizationId:college.organizationId,
 });
 const mappings:readonly {kind:Kind;id:number}[]=[
  {kind:"template",id:raw.templateId},
  ...(raw.classId!=null?[{kind:"section" as const,id:raw.classId}]:[]),
  ...(raw.mentorId!=null?[{kind:"mentor" as const,id:raw.mentorId}]:[]),
  ...raw.learnerIds.map(id=>({kind:"learner" as const,id})),
 ];
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const byKey=new Map<string,string>();
  for(const entry of mappings){
   const rows=await tx.select({id:legacyIdMap.newId})
    .from(legacyIdMap).where(and(
     entry.kind==="template"?
       or(isNull(legacyIdMap.collegeId),eq(legacyIdMap.collegeId,college.id)):
       eq(legacyIdMap.collegeId,college.id),
     inArray(legacyIdMap.legacyEntityType,[...sourceTypes[entry.kind]]),
     inArray(legacyIdMap.newEntityType,[...destinationTypes[entry.kind]]),
     eq(legacyIdMap.legacyId,String(entry.id)),
    )).limit(3);
   const [mapping]=rows;
   if(rows.length!==1||!mapping)throw new ProjectsServiceError("PROJECT_INVALID_STATE");
   byKey.set(entry.kind+":"+entry.id,mapping.id);
  }
  const mapped=(kind:Kind,id:number)=>byKey.get(kind+":"+id)!;
  const templateId=mapped("template",raw.templateId);
  const [template]=await tx.select({id:projectTemplates.id})
   .from(projectTemplates)
   .innerJoin(projectTemplateCollegeAssignments,and(
     eq(projectTemplateCollegeAssignments.templateId,projectTemplates.id),
     eq(projectTemplateCollegeAssignments.collegeId,college.id),
     isNull(projectTemplateCollegeAssignments.revokedAt)))
   .where(and(eq(projectTemplates.id,templateId),
      eq(projectTemplates.status,"PUBLISHED"))).limit(1);
  if(!template)throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_ASSIGNED");
  const sectionId=raw.classId!=null?mapped("section",raw.classId):null;
  if(sectionId){
   const [section]=await tx.select({id:sections.id}).from(sections)
    .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(eq(sections.id,sectionId),
      eq(sections.status,"ACTIVE"),eq(departments.collegeId,college.id))).limit(1);
   if(!section)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const mentorMembershipId=raw.mentorId!=null?mapped("mentor",raw.mentorId):null;
  const learnerMembershipIds=raw.learnerIds.map(id=>mapped("learner",id));
  if(new Set(learnerMembershipIds).size!==learnerMembershipIds.length)
   throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
  const check=async (membershipId:string,role:"MENTOR"|"LEARNER")=>{
   const [row]=await tx.select({id:collegeMemberships.id})
    .from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,role)))
    .where(and(eq(collegeMemberships.id,membershipId),
      eq(collegeMemberships.collegeId,college.id),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"))).limit(1);
   if(!row)throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
  };
  if(mentorMembershipId)await check(mentorMembershipId,"MENTOR");
  for(const membershipId of learnerMembershipIds)await check(membershipId,"LEARNER");
  return {collegeId:college.id,templateId,sectionId,
   primaryMentorMembershipId:mentorMembershipId,learnerMembershipIds,
   legacyTemplateBound:true as const};
 });
}
