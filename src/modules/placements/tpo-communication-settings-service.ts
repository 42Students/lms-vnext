import "server-only";
import {eq,sql} from "drizzle-orm";
import {
 tpoCommunicationChangeSchema,tpoCommunicationChanges,
 tpoCommunicationUpdateAlreadyApplied,
} from "./tpo-communication-change-model";
import {getDb} from "@/db/client";
import {activityEvents,colleges,placementTpoCollegeSettings} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";

export class TpoCommunicationSettingsError extends Error {
 constructor(public readonly code:"TPO_SETTINGS_PENDING"|"TPO_SETTINGS_STALE"|"TPO_SETTINGS_NOT_FOUND"){super(code);}
}

export async function getTpoCommunicationSettings(context:RequestContext){
 const collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_college_settings"))
  return {ready:false as const,smsMonthlyCap:500,emailSignature:"",recruiterAccessMonths:6,prepThresholdPct:60,notifyDriveOpenEmail:true,notifyResultApplied:true,notifyNudges:true,notifyPrepAssigned:true,version:null};
 // Read private college delivery settings only after checking persisted
 // account and membership permissions inside the same transaction. Otherwise
 // a demoted officer can still receive an in-flight response after revocation.
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({
   organizationId:colleges.organizationId,status:colleges.status,
  }).from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")
   throw new TpoCommunicationSettingsError("TPO_SETTINGS_NOT_FOUND");
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [row]=await tx.select({smsMonthlyCap:placementTpoCollegeSettings.smsMonthlyCap,
   emailSignature:placementTpoCollegeSettings.emailSignature,recruiterAccessMonths:placementTpoCollegeSettings.recruiterAccessMonths,prepThresholdPct:placementTpoCollegeSettings.prepThresholdPct,
   notifyDriveOpenEmail:placementTpoCollegeSettings.notifyDriveOpenEmail,
   notifyResultApplied:placementTpoCollegeSettings.notifyResultApplied,
   notifyNudges:placementTpoCollegeSettings.notifyNudges,
   notifyPrepAssigned:placementTpoCollegeSettings.notifyPrepAssigned,updatedAt:placementTpoCollegeSettings.updatedAt})
   .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  return {ready:true as const,smsMonthlyCap:row?.smsMonthlyCap??500,
   emailSignature:row?.emailSignature??"",recruiterAccessMonths:row?.recruiterAccessMonths??6,prepThresholdPct:row?.prepThresholdPct??60,
   notifyDriveOpenEmail:row?.notifyDriveOpenEmail??true,
   notifyResultApplied:row?.notifyResultApplied??true,
   notifyNudges:row?.notifyNudges??true,
   notifyPrepAssigned:row?.notifyPrepAssigned??true,version:row?.updatedAt.toISOString()??null};
 });
}

export async function updateTpoCommunicationSettings(context:RequestContext,raw:unknown){
 const input=tpoCommunicationChangeSchema.parse(raw);
 const collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_college_settings"))
  throw new TpoCommunicationSettingsError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoCommunicationSettingsError("TPO_SETTINGS_NOT_FOUND");
  // The request may have been authenticated before a concurrent role or
  // session revocation. Rebuild and lock the persisted actor in this write.
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select().from(placementTpoCollegeSettings)
   .where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  const changes=tpoCommunicationChanges(input);
  // The college row is locked above: a repeated successful request is a
  // harmless no-op with the same version and without another audit event.
  if(current&&tpoCommunicationUpdateAlreadyApplied(current,changes))
   return {saved:true,version:current.updatedAt.toISOString()};
  if((current?.updatedAt.toISOString()??null)!==input.expectedVersion)
   throw new TpoCommunicationSettingsError("TPO_SETTINGS_STALE");
  if(!current)await tx.insert(placementTpoCollegeSettings).values({collegeId});
  const [updated]=await tx.update(placementTpoCollegeSettings).set({...changes,updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoCollegeSettings.updatedAt}) + interval '1 millisecond')`})
   .where(eq(placementTpoCollegeSettings.collegeId,collegeId))
   .returning({updatedAt:placementTpoCollegeSettings.updatedAt});
  if(!updated)throw new TpoCommunicationSettingsError("TPO_SETTINGS_NOT_FOUND");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
   actorMembershipId:context.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_communication_setting.updated",subjectType:"TPO_SETTINGS",
   subjectId:collegeId,summary:input.section==="SMS_CAP"?"TPO changed the optional SMS monthly cap":
    input.section==="SIGNATURE"?"TPO changed the email signature":
    input.section==="PREP_THRESHOLD"?"TPO changed preparation readiness threshold":
    input.section==="OPTIONAL_EMAILS"?"TPO changed optional student email preferences":"TPO changed recruiter access duration",
   metadata:input.section==="SMS_CAP"?{field:"smsMonthlyCap",value:input.smsMonthlyCap}:
    input.section==="SIGNATURE"?{field:"emailSignature",length:input.emailSignature.length}:
    input.section==="PREP_THRESHOLD"?{field:"prepThresholdPct",value:input.prepThresholdPct}:
    input.section==="OPTIONAL_EMAILS"?{field:"studentOptionalEmails",changes:{
     driveOpenEmail:input.notifyDriveOpenEmail,resultApplied:input.notifyResultApplied,
     nudges:input.notifyNudges,prepAssigned:input.notifyPrepAssigned}}:
    {field:"recruiterAccessMonths",value:input.recruiterAccessMonths},
  });
  return {saved:true,version:updated.updatedAt.toISOString()};
 });
}
