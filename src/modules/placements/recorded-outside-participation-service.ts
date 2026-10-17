import "server-only";
import {and,asc,desc,eq,ilike} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,placementCompanies,
 placementCompanyRelationships,users} from "@/db/schema";
import {placementOutsideDriveParticipants,placementOutsideDriveRecords} from "@/db/schema/placement-outside-drives";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";
import {placementTableExists} from "./staged-tables";
import {PlacementsServiceError} from "./errors";
import {recordedOutsideParticipantSchema} from "./recorded-outside-participation-model";

export async function listTpoOutsideDriveRecords(context:RequestContext){
 const collegeId=await requireTpoJobCollege(context);
 await getDb().transaction(tx=>requireTpoJobActor(tx,context),{accessMode:"read only"});
 return getDb().select({
  id:placementOutsideDriveRecords.id,title:placementOutsideDriveRecords.title,
  company:placementCompanies.name,occurredAt:placementOutsideDriveRecords.occurredAt,
  externalReferenceUrl:placementOutsideDriveRecords.externalReferenceUrl,
 }).from(placementOutsideDriveRecords)
 .innerJoin(placementCompanyRelationships,and(
  eq(placementCompanyRelationships.id,placementOutsideDriveRecords.companyRelationshipId),
  eq(placementCompanyRelationships.collegeId,collegeId)))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .where(eq(placementOutsideDriveRecords.collegeId,collegeId))
 .orderBy(desc(placementOutsideDriveRecords.occurredAt),desc(placementOutsideDriveRecords.id)).limit(100);
}
export async function getTpoOutsideDriveParticipants(
 context:RequestContext,rawRecordId:unknown,search="",
){
 const collegeId=await requireTpoJobCollege(context);
 const recordId=z.string().uuid().parse(rawRecordId);
 await getDb().transaction(tx=>requireTpoJobActor(tx,context),{accessMode:"read only"});
 const [record]=await getDb().select({
  id:placementOutsideDriveRecords.id,title:placementOutsideDriveRecords.title,
  occurredAt:placementOutsideDriveRecords.occurredAt,
  notes:placementOutsideDriveRecords.notes,
 }).from(placementOutsideDriveRecords).where(and(eq(placementOutsideDriveRecords.id,recordId),
 eq(placementOutsideDriveRecords.collegeId,collegeId))).limit(1);
 if(!record)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const available=await placementTableExists("placement_outside_drive_participants");
 const participants=available?await getDb().select({
  id:placementOutsideDriveParticipants.id,
  membershipId:placementOutsideDriveParticipants.membershipId,
  result:placementOutsideDriveParticipants.result,notes:placementOutsideDriveParticipants.notes,
  name:users.displayName,
 }).from(placementOutsideDriveParticipants)
 .innerJoin(collegeMemberships,and(
  eq(collegeMemberships.id,placementOutsideDriveParticipants.membershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(eq(placementOutsideDriveParticipants.outsideDriveId,recordId),
   eq(placementOutsideDriveParticipants.collegeId,collegeId)))
 .orderBy(asc(users.displayName),asc(placementOutsideDriveParticipants.id)).limit(500):[];
 const choices=await getDb().select({
  id:collegeMemberships.id,name:users.displayName,
 }).from(collegeMemberships)
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(
  eq(membershipRoles.membershipId,collegeMemberships.id),
  eq(membershipRoles.role,"LEARNER")))
 .where(and(eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
   search.trim()?ilike(users.displayName,"%"+search.trim().slice(0,80)+"%"):undefined))
 .orderBy(asc(users.displayName),asc(collegeMemberships.id)).limit(50);
 return {record,participants,choices,available};
}
/** TPO-drives-31: external participation is historical evidence and never
 * creates an application, interview slot, placement offer or reminder.
 */
export async function setTpoOutsideDriveParticipant(context:RequestContext,raw:unknown){
 const input=recordedOutsideParticipantSchema.parse(raw);
 const collegeId=await requireTpoJobCollege(context);
 if(!await placementTableExists("placement_outside_drive_participants"))
  throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [record]=await tx.select({
   id:placementOutsideDriveRecords.id,title:placementOutsideDriveRecords.title,
  }).from(placementOutsideDriveRecords).where(and(
   eq(placementOutsideDriveRecords.id,input.recordId),
   eq(placementOutsideDriveRecords.collegeId,collegeId))).for("share").limit(1);
  if(!record)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const [learner]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
     eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(collegeMemberships.id,input.membershipId),
    eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
   .for("share").limit(1);
  if(!learner)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const [saved]=await tx.insert(placementOutsideDriveParticipants).values({
   outsideDriveId:record.id,collegeId,membershipId:learner.id,result:input.result,
   notes:input.notes??null,updatedByUserId:context.user.id,
  }).onConflictDoUpdate({
   target:[placementOutsideDriveParticipants.outsideDriveId,
    placementOutsideDriveParticipants.membershipId],
   set:{result:input.result,notes:input.notes??null,updatedAt:new Date(),
    updatedByUserId:context.user.id},
  }).returning({id:placementOutsideDriveParticipants.id});
  if(!saved)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  await tx.insert(activityEvents).values({
   organizationId:context.membership!.organizationId,collegeId,
   actorUserId:context.user.id,actorMembershipId:context.membership!.id,
   module:"PLACEMENTS",eventType:"placements.outside_drive.participant_recorded",
   subjectType:"outside_drive",subjectId:record.id,
   summary:"External drive participation updated for "+record.title,
   metadata:{membershipId:learner.id,result:input.result},occurredAt:new Date(),
  });
  return {id:saved.id,recordId:record.id,result:input.result};
 });
}
