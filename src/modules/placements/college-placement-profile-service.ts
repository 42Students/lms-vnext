import "server-only";
import {randomUUID} from "node:crypto";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,colleges,learnerProfiles,membershipRoles} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";

const skill=z.strictObject({
 name:z.string().trim().min(1).max(120),
 proficiency:z.enum(["","Beginner","Intermediate","Advanced","Expert"]),
});
const profileEditSchema=z.strictObject({
 membershipId:z.string().uuid(),
 expectedVersion:z.number().int().min(0),
 action:z.enum(["ADD_SKILL","EDIT_SKILL","DELETE_SKILL","SET_PREFERENCES"]),
 index:z.number().int().min(0).max(99).optional(),
 skill:skill.optional(),
 preferences:learnerProfileDocumentSchema.shape.jobPreferences.optional(),
 confirmed:z.literal(true),
}).superRefine((input,ctx)=>{
 if((input.action==="ADD_SKILL"||input.action==="EDIT_SKILL")&&!input.skill)
  ctx.addIssue({code:"custom",path:["skill"],message:"Skill and proficiency are required"});
 if((input.action==="EDIT_SKILL"||input.action==="DELETE_SKILL")&&input.index===undefined)
  ctx.addIssue({code:"custom",path:["index"],message:"Choose a skill from the current list"});
 if(input.action==="SET_PREFERENCES"&&!input.preferences)
  ctx.addIssue({code:"custom",path:["preferences"],message:"Job preferences are required"});
});

/** A college placement administrator can correct only a learner belonging to
 * the actively selected college. Skill indices are evaluated after an exclusive
 * row lock and version comparison so a stale index cannot remove another row.
 * Raw object URLs and resume paths are deliberately not accepted here.
 */
export async function editCollegeStudentPlacementProfile(context:RequestContext,raw:unknown){
 const input=profileEditSchema.parse(raw);
 const collegeId=await requireCollegePlacementAdmin(context);
 return getDb().transaction(async tx=>{
  const [owner]=await tx.select({id:collegeMemberships.id,organizationId:colleges.organizationId}).from(collegeMemberships)
   .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(collegeMemberships.id,input.membershipId),
    eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"))).for("share").limit(1);
  if(!owner)throw new AuthorizationError("placements.manage");
  await tx.insert(learnerProfiles).values({
    membershipId:input.membershipId,profileDocument:{},
  }).onConflictDoNothing();
  const [locked]=await tx.select({
    document:learnerProfiles.profileDocument,
    version:learnerProfiles.profileDocumentVersion,
  }).from(learnerProfiles)
   .where(eq(learnerProfiles.membershipId,input.membershipId))
   .for("update").limit(1);
  if(!locked||locked.version!==input.expectedVersion)
   throw new Error("Learner profile changed. Reload before editing this skill.");
  const source=locked.document??{};
  const oldSkills=learnerProfileDocumentSchema.shape.skills.parse(source.skills??[]);
  const oldPreferences=learnerProfileDocumentSchema.shape.jobPreferences.parse(source.jobPreferences??{});
  const nextSkills=[...oldSkills];
  let nextPreferences=oldPreferences;
  if(input.action==="ADD_SKILL"){
   if(nextSkills.length>=100)throw new Error("The skills list is full.");
   nextSkills.push({id:randomUUID(),name:input.skill!.name,
    proficiency:input.skill!.proficiency});
  }else if(input.action==="EDIT_SKILL"){
   if(input.index! >= nextSkills.length)throw new Error("Skill row changed. Refresh before retrying.");
   nextSkills[input.index!]={...nextSkills[input.index!]!,
    name:input.skill!.name,proficiency:input.skill!.proficiency};
  }else if(input.action==="DELETE_SKILL"){
   if(input.index!>=nextSkills.length)throw new Error("Skill row changed. Refresh before retrying.");
   nextSkills.splice(input.index!,1);
  }else{
   nextPreferences=input.preferences!;
  }
  const key=input.action==="SET_PREFERENCES"?"jobPreferences":"skills";
  const next=key==="skills"
   ?learnerProfileDocumentSchema.shape.skills.parse(nextSkills)
   :learnerProfileDocumentSchema.shape.jobPreferences.parse(nextPreferences);
  const [saved]=await tx.update(learnerProfiles).set({
   profileDocument:sql`jsonb_set(${learnerProfiles.profileDocument},
    ARRAY[${key}]::text[],${JSON.stringify(next)}::jsonb,true)`,
   profileDocumentVersion:sql`${learnerProfiles.profileDocumentVersion}+1`,
   updatedAt:new Date(),
  }).where(and(eq(learnerProfiles.membershipId,input.membershipId),
   eq(learnerProfiles.profileDocumentVersion,input.expectedVersion)))
   .returning({version:learnerProfiles.profileDocumentVersion});
  if(!saved)throw new Error("Learner profile changed. Reload before retrying.");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.IDENTITY_LEARNER_PROFILE_SECTION_UPDATED,
   collegeId,organizationId:owner.organizationId,
   subjectType:"learner_profile",subjectId:input.membershipId,
   summary:"College placement administrator corrected learner profile "+key,
   metadata:{section:key,action:input.action,index:input.index??null,
    beforeCount:oldSkills.length,afterCount:nextSkills.length,
    actorUserId:context.user.id,subjectMembershipId:input.membershipId},
  });
  return {version:saved.version,skills:nextSkills,jobPreferences:nextPreferences};
 });
}
