import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {
 tpoCommunicationChangeSchema,tpoCommunicationChanges,
 tpoCommunicationUpdateAlreadyApplied,
} from "./tpo-communication-change-model";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,membershipRoles,placementTpoCollegeSettings,users} from "@/db/schema";
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
  return {ready:false as const,smsMonthlyCap:500,emailSignature:"",recruiterAccessMonths:6,recruiterDriveNeedsApproval:true,prepThresholdPct:60,notifyDriveOpenEmail:true,notifyResultApplied:true,notifyNudges:true,notifyPrepAssigned:true,version:null};
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
   emailSignature:placementTpoCollegeSettings.emailSignature,recruiterAccessMonths:placementTpoCollegeSettings.recruiterAccessMonths,recruiterDriveNeedsApproval:placementTpoCollegeSettings.recruiterDriveNeedsApproval,prepThresholdPct:placementTpoCollegeSettings.prepThresholdPct,
   notifyDriveOpenEmail:placementTpoCollegeSettings.notifyDriveOpenEmail,
   notifyResultApplied:placementTpoCollegeSettings.notifyResultApplied,
   notifyNudges:placementTpoCollegeSettings.notifyNudges,
   notifyPrepAssigned:placementTpoCollegeSettings.notifyPrepAssigned,updatedAt:placementTpoCollegeSettings.updatedAt})
   .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  return {ready:true as const,smsMonthlyCap:row?.smsMonthlyCap??500,
   emailSignature:row?.emailSignature??"",recruiterAccessMonths:row?.recruiterAccessMonths??6,recruiterDriveNeedsApproval:row?.recruiterDriveNeedsApproval??true,prepThresholdPct:row?.prepThresholdPct??60,
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
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoCommunicationSettingsError("TPO_SETTINGS_NOT_FOUND");
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
    input.section==="OPTIONAL_EMAILS"?"TPO changed optional student email preferences":
    input.section==="RECRUITER_APPROVAL"?"TPO changed recruiter drive approval":"TPO changed recruiter access duration",
   metadata:input.section==="SMS_CAP"?{field:"smsMonthlyCap",value:input.smsMonthlyCap}:
    input.section==="SIGNATURE"?{field:"emailSignature",length:input.emailSignature.length}:
    input.section==="PREP_THRESHOLD"?{field:"prepThresholdPct",value:input.prepThresholdPct}:
    input.section==="OPTIONAL_EMAILS"?{field:"studentOptionalEmails",changes:{
     driveOpenEmail:input.notifyDriveOpenEmail,resultApplied:input.notifyResultApplied,
     nudges:input.notifyNudges,prepAssigned:input.notifyPrepAssigned}}:
    input.section==="RECRUITER_APPROVAL"?{field:"recruiterDriveNeedsApproval",value:input.recruiterDriveNeedsApproval}:
    {field:"recruiterAccessMonths",value:input.recruiterAccessMonths},
  });
  return {saved:true,version:updated.updatedAt.toISOString()};
 });
}


/**
 * Shared delivery-time policy. Settings are mutable between enqueue and send,
 * so callers must load current college settings and evaluate this again when
 * claiming the outbox row. This pure function never sends a notification.
 *
 * The old LMS made only interview mail eligible for LEARNER recipients; other
 * student events are app-only even if a legacy optional-email switch is on.
 * The fixed always-on SMS notices do not count against the optional SMS cap.
 */
export type TpoDispatchEvent =
 "DRIVE_PUBLISHED"|"DRIVE_UPDATED"|"APPLICATION_STATUS_CHANGED"|
 "NOW_INELIGIBLE"|"NUDGE"|"PREP_ASSIGNED"|"ROUND_SCHEDULED"|
 "ROUND_REMINDER"|"OFFER_RELEASED"|"OFFER_EXPIRING"|
 "DEADLINE_TODAY"|"DRIVE_CANCELLED";
export type TpoDispatchChannel="APP"|"EMAIL"|"SMS";
export type TpoDispatchRecipient="LEARNER"|"TPO"|"RECRUITER";
export type TpoDeliveryPreferences={
 notifyDriveOpenEmail:boolean;notifyResultApplied:boolean;
 notifyNudges:boolean;notifyPrepAssigned:boolean;smsMonthlyCap:number;
};
export type TpoDispatchDecision=
 {allowed:true;sendAfter:Date;countsAgainstOptionalSmsCap:boolean}|
 {allowed:false;reason:"CHANNEL_NOT_ALLOWED"|"OPTION_DISABLED"};

const SMS_ALWAYS_ON:ReadonlySet<TpoDispatchEvent>=new Set([
 "ROUND_SCHEDULED","OFFER_RELEASED","OFFER_EXPIRING",
 "DEADLINE_TODAY","DRIVE_CANCELLED",
]);
const EMAIL_INTERVIEW:ReadonlySet<TpoDispatchEvent>=new Set([
 "ROUND_SCHEDULED","ROUND_REMINDER",
]);
const DIGEST_NOTICE:ReadonlySet<TpoDispatchEvent>=new Set([
 "APPLICATION_STATUS_CHANGED","NUDGE","PREP_ASSIGNED","NOW_INELIGIBLE",
]);

/** Next 08:00 IST, expressed as a UTC Date even on a non-India app server. */
export function nextTpoEmailDigestAt(now:Date):Date{
 if(!Number.isFinite(now.getTime()))throw new Error("Invalid delivery clock");
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).formatToParts(now);
 const value=(key:string)=>Number(parts.find(part=>part.type===key)?.value);
 const next=new Date(Date.UTC(value("year"),value("month")-1,value("day"),2,30,0));
 if(next.getTime()<=now.getTime())next.setUTCDate(next.getUTCDate()+1);
 return next;
}

/** A dispatch policy decision is not a send grant: the worker must still
 * confirm recipient status, tenant scope, dedupe and suppression at send time.
 */
export function tpoOutgoingDispatchDecision(input:{
 event:TpoDispatchEvent;channel:TpoDispatchChannel;
 recipient:TpoDispatchRecipient;settings:TpoDeliveryPreferences;
 now:Date;
}):TpoDispatchDecision{
 const {event,channel,recipient,settings,now}=input;
 if(!Number.isFinite(now.getTime()))throw new Error("Invalid delivery clock");
 const switchOn=event==="DRIVE_PUBLISHED"||event==="DRIVE_UPDATED"
  ?settings.notifyDriveOpenEmail
  :event==="APPLICATION_STATUS_CHANGED"||event==="NOW_INELIGIBLE"
   ?settings.notifyResultApplied
   :event==="NUDGE"?settings.notifyNudges
   :event==="PREP_ASSIGNED"?settings.notifyPrepAssigned:true;
 if(channel==="EMAIL"){
  if(recipient==="LEARNER"&&!EMAIL_INTERVIEW.has(event))
   return {allowed:false,reason:"CHANNEL_NOT_ALLOWED"};
  if(!switchOn)return {allowed:false,reason:"OPTION_DISABLED"};
  return {allowed:true,sendAfter:DIGEST_NOTICE.has(event)?
   nextTpoEmailDigestAt(now):now,countsAgainstOptionalSmsCap:false};
 }
 if(channel==="SMS"){
  // All current student SMS events are fixed compulsory notices. Other
  // event types may never use SMS through this interface.
  if(!SMS_ALWAYS_ON.has(event))return {allowed:false,reason:"CHANNEL_NOT_ALLOWED"};
  return {allowed:true,sendAfter:now,countsAgainstOptionalSmsCap:false};
 }
 // The preference check is for optional outgoing EMAIL only; turning that
 // off must not suppress a learner's in-app placement notice.
 return {allowed:true,sendAfter:now,countsAgainstOptionalSmsCap:false};
}

/** Delivery-time admission for a future audited, provider-backed TPO outbox.
 * Enqueue-time settings alone are never an authorization to send. Call this
 * again immediately before claiming each external delivery; never use a
 * snapshot cached in an app process. No email/SMS is sent by this function.
 */
const tpoDispatchClaimSchema=z.strictObject({
 collegeId:z.uuid(),recipientUserId:z.uuid(),
 event:z.enum([
  "DRIVE_PUBLISHED","DRIVE_UPDATED","APPLICATION_STATUS_CHANGED",
  "NOW_INELIGIBLE","NUDGE","PREP_ASSIGNED","ROUND_SCHEDULED",
  "ROUND_REMINDER","OFFER_RELEASED","OFFER_EXPIRING",
  "DEADLINE_TODAY","DRIVE_CANCELLED",
 ]),
 channel:z.enum(["APP","EMAIL","SMS"]),
 recipient:z.enum(["LEARNER","TPO","RECRUITER"]),
 now:z.date(),
});
export type TpoOutboundClaimDecision=
 | {status:"ALLOW";sendAfter:Date;countsAgainstOptionalSmsCap:boolean;settingsVersion:Date|null}
 | {status:"DEFER";sendAfter:Date;settingsVersion:Date|null}
 | {status:"SUPPRESS";reason:"CHANNEL_NOT_ALLOWED"|"OPTION_DISABLED"|"RECIPIENT_UNAVAILABLE"|"SETTINGS_NOT_READY"};

export async function claimTpoOutgoingPolicyAtSend(raw:unknown):Promise<TpoOutboundClaimDecision>{
 const input=tpoDispatchClaimSchema.parse(raw);
 if(!Number.isFinite(input.now.getTime()))
  return {status:"SUPPRESS",reason:"SETTINGS_NOT_READY"};
 if(!await placementTableExists("placement_tpo_college_settings"))
  return {status:"SUPPRESS",reason:"SETTINGS_NOT_READY"};
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id})
   .from(colleges).where(and(eq(colleges.id,input.collegeId),
     eq(colleges.status,"ACTIVE"))).for("share").limit(1);
  if(!college)return {status:"SUPPRESS" as const,reason:"RECIPIENT_UNAVAILABLE" as const};
  // A recruiter is outside the college membership roster: their delivery
  // must be granted and reverified by the separate company relationship
  // dispatcher. In its absence this path remains fail-closed.
  if(input.recipient==="RECRUITER")
   return {status:"SUPPRESS" as const,reason:"RECIPIENT_UNAVAILABLE" as const};
  const [member]=await tx.select({id:collegeMemberships.id})
   .from(collegeMemberships)
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
     eq(users.platformStatus,"ACTIVE")))
   .innerJoin(membershipRoles,and(
     eq(membershipRoles.membershipId,collegeMemberships.id),
     eq(membershipRoles.role,input.recipient==="LEARNER"?"LEARNER":"TPO")))
   .where(and(eq(collegeMemberships.collegeId,input.collegeId),
     eq(collegeMemberships.userId,input.recipientUserId),
     eq(collegeMemberships.status,"ACTIVE"))).for("share").limit(1);
  if(!member)
   return {status:"SUPPRESS" as const,reason:"RECIPIENT_UNAVAILABLE" as const};
  const [row]=await tx.select({
   notifyDriveOpenEmail:placementTpoCollegeSettings.notifyDriveOpenEmail,
   notifyResultApplied:placementTpoCollegeSettings.notifyResultApplied,
   notifyNudges:placementTpoCollegeSettings.notifyNudges,
   notifyPrepAssigned:placementTpoCollegeSettings.notifyPrepAssigned,
   smsMonthlyCap:placementTpoCollegeSettings.smsMonthlyCap,
   updatedAt:placementTpoCollegeSettings.updatedAt,
  }).from(placementTpoCollegeSettings)
   .where(eq(placementTpoCollegeSettings.collegeId,input.collegeId))
   .for("share").limit(1);
  const settings:TpoDeliveryPreferences={
   notifyDriveOpenEmail:row?.notifyDriveOpenEmail??true,
   notifyResultApplied:row?.notifyResultApplied??true,
   notifyNudges:row?.notifyNudges??true,
   notifyPrepAssigned:row?.notifyPrepAssigned??true,
   smsMonthlyCap:row?.smsMonthlyCap??500,
  };
  const decision=tpoOutgoingDispatchDecision({...input,settings});
  if(!decision.allowed)return {
   status:"SUPPRESS" as const,reason:decision.reason,
  };
  if(decision.sendAfter.getTime()>input.now.getTime())return {
   status:"DEFER" as const,sendAfter:decision.sendAfter,
   settingsVersion:row?.updatedAt??null,
  };
  return {status:"ALLOW" as const,sendAfter:decision.sendAfter,
   countsAgainstOptionalSmsCap:decision.countsAgainstOptionalSmsCap,
   settingsVersion:row?.updatedAt??null};
 });
}
