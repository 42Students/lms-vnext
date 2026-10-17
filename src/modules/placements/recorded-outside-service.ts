import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,placementCompanyRelationships,placementCompanies,
 placementRecruiterCollegeGrants,placementRecruiterProfiles,
 activityEvents,collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {placementOutsideDriveRecords} from "@/db/schema/placement-outside-drives";
import {recordedOutsideDriveSchema} from "./recorded-outside-model";
import {PlacementsServiceError} from "./errors";
import {z} from "zod";

async function outsideActor(context:RequestContext,collegeId:string,relationshipId:string){
 const [relationship]=await getDb().select({
  id:placementCompanyRelationships.id,collegeId:placementCompanyRelationships.collegeId,
  name:placementCompanies.name,organizationId:colleges.organizationId,
 }).from(placementCompanyRelationships)
 .innerJoin(placementCompanies,and(
  eq(placementCompanies.id,placementCompanyRelationships.companyId),
  eq(placementCompanies.status,"ACTIVE")))
 .innerJoin(colleges,and(eq(colleges.id,placementCompanyRelationships.collegeId),eq(colleges.status,"ACTIVE")))
 .where(and(eq(placementCompanyRelationships.id,relationshipId),
  eq(placementCompanyRelationships.collegeId,collegeId),eq(placementCompanyRelationships.status,"ACTIVE")))
 .limit(1);
 if(!relationship)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
 const tpo=Boolean(context.membership&&hasMembershipRole(context,"TPO")&&
  context.membership.collegeId===collegeId);
 if(tpo){
  const [actor]=await getDb().select({id:collegeMemberships.id})
   .from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
   .where(and(eq(collegeMemberships.id,context.membership!.id),
    eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.userId,context.user.id),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(!actor)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  return {relationship,role:"TPO" as const};
 }
 if(context.recruiter?.status!=="ACTIVE"||context.recruiter.userId!==context.user.id)
  throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [actor]=await getDb().select({userId:placementRecruiterProfiles.userId})
  .from(placementRecruiterProfiles)
  .innerJoin(placementRecruiterCollegeGrants,and(
   eq(placementRecruiterCollegeGrants.recruiterUserId,placementRecruiterProfiles.userId),
   eq(placementRecruiterCollegeGrants.companyRelationshipId,relationshipId),
   eq(placementRecruiterCollegeGrants.status,"ACTIVE")))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId),
   eq(placementCompanyRelationships.companyId,placementRecruiterProfiles.companyId)))
  .where(and(eq(placementRecruiterProfiles.userId,context.user.id),
   eq(placementRecruiterProfiles.status,"ACTIVE"))).limit(1);
 if(!actor||!can(context,"placements.recruiter.read",{
  collegeId,placementCompanyRelationshipId:relationshipId,
 }))throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return {relationship,role:"RECRUITER" as const};
}
export async function recordOutsideDrive(context:RequestContext,raw:unknown){
 const input=recordedOutsideDriveSchema.parse(raw);
 const actor=await outsideActor(context,input.collegeId,input.companyRelationshipId);
 if(actor.role==="RECRUITER"&&!can(context,"placements.recruiter.outside.record",{
  collegeId:actor.relationship.collegeId,
  placementCompanyRelationshipId:actor.relationship.id,
 }))throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return getDb().transaction(async tx=>{
  if(actor.role==="TPO"){
   await assertPersistedPlatformPermission(tx,context,"placements.manage",{
    collegeId:input.collegeId,organizationId:actor.relationship.organizationId,
   });
  }else{
   const [current]=await tx.select({id:placementRecruiterCollegeGrants.id})
    .from(placementRecruiterCollegeGrants)
    .innerJoin(placementRecruiterProfiles,and(
     eq(placementRecruiterProfiles.userId,placementRecruiterCollegeGrants.recruiterUserId),
     eq(placementRecruiterProfiles.status,"ACTIVE")))
    .where(and(eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
     eq(placementRecruiterCollegeGrants.companyRelationshipId,actor.relationship.id),
     eq(placementRecruiterCollegeGrants.status,"ACTIVE"))).for("share").limit(1);
   if(!current)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  }
  const [saved]=await tx.insert(placementOutsideDriveRecords).values({
   collegeId:actor.relationship.collegeId,companyRelationshipId:actor.relationship.id,
   title:input.title,externalReferenceUrl:input.externalReferenceUrl??null,
   occurredAt:input.occurredAt,notes:input.notes??null,
   recordedByUserId:context.user.id,recordedByRole:actor.role,
  }).returning({id:placementOutsideDriveRecords.id});
  if(!saved)throw new Error("RECORDED_OUTSIDE_INSERT_FAILED");
  await tx.insert(activityEvents).values({
   organizationId:actor.relationship.organizationId,collegeId:actor.relationship.collegeId,
   actorUserId:context.user.id,module:"PLACEMENTS",
   eventType:"placements.drive.recorded_outside",subjectType:"outside_drive",subjectId:saved.id,
   summary:"External placement drive recorded (not published)",
   metadata:{companyRelationshipId:actor.relationship.id,source:actor.role},
  });
  return {id:saved.id,collegeId:actor.relationship.collegeId,recordedOutside:true as const,role:actor.role};
 });
}
/** TPO-drives-31: a distinct historical register, never merged with publishable jobs. */
export async function listTpoRecordedOutsideDrives(context:RequestContext,rawCollegeId:unknown){
 const collegeId=z.string().uuid().parse(rawCollegeId);
 if(!context.membership||context.membership.collegeId!==collegeId||
   !hasMembershipRole(context,"TPO")||context.membership.status!=="ACTIVE"||
   context.user.platformStatus!=="ACTIVE")
   throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 // Read permission is persisted and college-scoped, not inferred from the URL.
 const [actor]=await getDb().select({id:collegeMemberships.id}).from(collegeMemberships)
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
   .where(and(eq(collegeMemberships.id,context.membership.id),
    eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"))).limit(1);
 if(!actor||!can(context,"placements.manage",{collegeId}))
   throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const rows=await getDb().select({
  id:placementOutsideDriveRecords.id,title:placementOutsideDriveRecords.title,
  occurredAt:placementOutsideDriveRecords.occurredAt,
  externalReferenceUrl:placementOutsideDriveRecords.externalReferenceUrl,
  notes:placementOutsideDriveRecords.notes,recordedByRole:placementOutsideDriveRecords.recordedByRole,
  companyName:placementCompanies.name,
 }).from(placementOutsideDriveRecords)
 .innerJoin(placementCompanyRelationships,and(
  eq(placementCompanyRelationships.id,placementOutsideDriveRecords.companyRelationshipId),
  eq(placementCompanyRelationships.collegeId,collegeId)))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .where(eq(placementOutsideDriveRecords.collegeId,collegeId))
 .orderBy(desc(placementOutsideDriveRecords.occurredAt),desc(placementOutsideDriveRecords.id))
 .limit(101);
 return {rows:rows.slice(0,100),truncated:rows.length>100};
}
export async function recordedOutsideChoices(context:RequestContext,rawCollegeId:unknown){
 const collegeId=z.string().uuid().parse(rawCollegeId);
 // Verify the caller has a persisted relationship BEFORE returning company names.
 const all=await getDb().select({
  id:placementCompanyRelationships.id,collegeId:placementCompanyRelationships.collegeId,
  name:placementCompanies.name,
 }).from(placementCompanyRelationships)
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .where(and(eq(placementCompanyRelationships.collegeId,collegeId),
  eq(placementCompanyRelationships.status,"ACTIVE"),eq(placementCompanies.status,"ACTIVE")))
 .limit(100);
 const authorized=[] as typeof all;
 for(const row of all){
  try{await outsideActor(context,collegeId,row.id);authorized.push(row);}
  catch(error){if(!(error instanceof PlacementsServiceError))throw error;}
 }
 return {status:"READY" as const,choices:authorized};
}

/** A URL parameter is not evidence a record was saved. Verify against DB. */
export async function verifyRecordedOutsideConfirmation(context:RequestContext,collegeId:string,rawId:unknown){
 const parsed=z.string().uuid().safeParse(rawId);
 if(!parsed.success)return false;
 const [record]=await getDb().select({
  id:placementOutsideDriveRecords.id,companyRelationshipId:placementOutsideDriveRecords.companyRelationshipId,
 }).from(placementOutsideDriveRecords).where(and(
  eq(placementOutsideDriveRecords.id,parsed.data),
  eq(placementOutsideDriveRecords.collegeId,collegeId),
  eq(placementOutsideDriveRecords.recordedByUserId,context.user.id),
 )).limit(1);
 if(!record)return false;
 try{await outsideActor(context,collegeId,record.companyRelationshipId);return true;}
 catch(error){if(error instanceof PlacementsServiceError)return false;throw error;}
}
