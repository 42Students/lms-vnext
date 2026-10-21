import "server-only";
import {and,asc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,colleges,attendanceParentContacts,attendanceParentSmsOutbox,attendanceRecords,collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireAttendanceCollege} from "./admin-service";
import {attendanceParentContactInputSchema,attendanceParentSmsBody,canNotifyVerifiedParent,type AttendanceParentSmsKind} from "./parent-sms-model";
import {sendAttendanceParentSms} from "./parent-sms-provider";
import {z} from "zod";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function parentTablesReady(tx:Tx):Promise<boolean>{
 const found=await tx.execute(sql`select
  to_regclass('public.attendance_parent_contacts') is not null as contacts,
  to_regclass('public.attendance_parent_sms_outbox') is not null as outbox`);
 const rows=Array.isArray(found)?found:(found as {rows?:unknown[]}).rows??[];
 const row=rows[0] as {contacts?:boolean;outbox?:boolean}|undefined;
 return row?.contacts===true&&row.outbox===true;
}
/** College Admin attestation of a separately verified guardian contact and
 * documented opt-in. Never infer parent ownership from learner alternate phone. */
export async function recordVerifiedAttendanceParentContact(ctx:RequestContext,raw:unknown){
 const input=attendanceParentContactInputSchema.parse(raw);
 const college=await requireAttendanceCollege(ctx,input.collegeId);
 return getDb().transaction(async tx=>{
  if(!(await parentTablesReady(tx)))return {recorded:false,reason:"PARENT_SMS_SCHEMA_NOT_REGISTERED"};
  const [learner]=await tx.select({id:collegeMemberships.id})
   .from(collegeMemberships)
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(collegeMemberships.id,input.membershipId),
    eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE")))
   .limit(1);
  if(!learner)throw new Error("Learner enrollment is unavailable.");
  const now=new Date();
  await tx.insert(attendanceParentContacts).values({
   membershipId:input.membershipId,collegeId:college.id,phoneE164:input.phoneE164,
   smsOptIn:true,consentEvidenceReference:input.consentEvidenceReference,
   consentAt:now,verifiedAt:now,verifiedByUserId:ctx.user.id,
  }).onConflictDoUpdate({target:attendanceParentContacts.membershipId,set:{
   phoneE164:input.phoneE164,smsOptIn:true,
   consentEvidenceReference:input.consentEvidenceReference,
   consentAt:now,verifiedAt:now,verifiedByUserId:ctx.user.id,updatedAt:now,
  }});
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.collegeId===college.id?ctx.membership.id:null,
   module:"COURSES",eventType:"ATTENDANCE_PARENT_SMS_CONSENT_UPDATED",
   subjectType:"learner_membership",subjectId:input.membershipId,
   summary:"College Admin recorded verified guardian attendance messaging consent",
   metadata:{smsOptIn:true},occurredAt:now,
  });
  return {recorded:true};
 });
}
/** Revocation requires no parent phone disclosure and cancels unsent
 * notices transactionally. Already attempted provider requests cannot be undone. */
export async function revokeAttendanceParentContact(ctx:RequestContext,raw:unknown){
 const input=z.object({collegeId:z.string().uuid(),membershipId:z.string().uuid()}).strict().parse(raw);
 const college=await requireAttendanceCollege(ctx,input.collegeId);
 return getDb().transaction(async tx=>{
  if(!(await parentTablesReady(tx)))return {revoked:false,ready:false};
  const [saved]=await tx.update(attendanceParentContacts)
   .set({smsOptIn:false,updatedAt:new Date()})
   .where(and(eq(attendanceParentContacts.collegeId,college.id),
    eq(attendanceParentContacts.membershipId,input.membershipId),
    eq(attendanceParentContacts.smsOptIn,true)))
   .returning({membershipId:attendanceParentContacts.membershipId});
  if(!saved)return {revoked:false,ready:true};
  await tx.update(attendanceParentSmsOutbox).set({status:"SKIPPED"}).where(and(
   eq(attendanceParentSmsOutbox.collegeId,college.id),
   eq(attendanceParentSmsOutbox.membershipId,input.membershipId),
   eq(attendanceParentSmsOutbox.status,"QUEUED")));
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.collegeId===college.id?ctx.membership.id:null,
   module:"COURSES",eventType:"ATTENDANCE_PARENT_SMS_CONSENT_REVOKED",
   subjectType:"learner_membership",subjectId:input.membershipId,
   summary:"College Admin disabled guardian attendance SMS",
   metadata:{smsOptIn:false},
  });
  return {revoked:true,ready:true};
 });
}
/** Only a changed attendance record can enqueue a parent notice. Call from the
 * same attendance correction transaction after creating its immutable event. */
export async function enqueueAttendanceParentSms(tx:Tx,input:{
 eventId:string;collegeId:string;membershipId:string;scheduleEventId:string;
 kind:AttendanceParentSmsKind;courseName:string;startsAt:Date;endsAt:Date;
}):Promise<string|null>{
 if(!(await parentTablesReady(tx)))return null;
 const [contact]=await tx.select().from(attendanceParentContacts).where(and(
  eq(attendanceParentContacts.membershipId,input.membershipId),
  eq(attendanceParentContacts.collegeId,input.collegeId))).limit(1);
 if(!contact||!canNotifyVerifiedParent(contact))return null;
 const [entry]=await tx.insert(attendanceParentSmsOutbox).values({
  eventId:input.eventId,collegeId:input.collegeId,membershipId:input.membershipId,
  scheduleEventId:input.scheduleEventId,kind:input.kind,courseName:input.courseName,
  startsAt:input.startsAt,endsAt:input.endsAt,
 }).onConflictDoNothing().returning({id:attendanceParentSmsOutbox.id});
 return entry?.id??null;
}
/** Provider attempt occurs after the attendance transaction commits.
 * Retry only QUEUED rows; an uncertain attempt is never silently re-sent. */
export async function dispatchQueuedAttendanceParentSms(rawId:string){
 const id=z.string().uuid().parse(rawId);
 const db=getDb();
 const [entry]=await db.select().from(attendanceParentSmsOutbox)
  .where(and(eq(attendanceParentSmsOutbox.id,id),eq(attendanceParentSmsOutbox.status,"QUEUED"))).limit(1);
 if(!entry)return {status:"ALREADY_HANDLED" as const};
 // A queued notice can become outdated before credentials are configured.
 // Never notify a parent of an absence that has since been corrected.
 const [currentAttendance]=await db.select({status:attendanceRecords.status})
  .from(attendanceRecords).where(and(
   eq(attendanceRecords.scheduleEventId,entry.scheduleEventId),
   eq(attendanceRecords.membershipId,entry.membershipId))).limit(1);
 const actualAbsent=currentAttendance?.status==="ABSENT";
 const eventStillCurrent=entry.kind==="ABSENT"?actualAbsent:currentAttendance===undefined;
 if(!eventStillCurrent){
  await db.update(attendanceParentSmsOutbox).set({status:"SKIPPED"}).where(and(
   eq(attendanceParentSmsOutbox.id,id),eq(attendanceParentSmsOutbox.status,"QUEUED")));
  return {status:"SKIPPED" as const};
 }
 const [contact]=await db.select().from(attendanceParentContacts).where(and(
  eq(attendanceParentContacts.membershipId,entry.membershipId),
  eq(attendanceParentContacts.collegeId,entry.collegeId))).limit(1);
 // A changed verified guardian number must not inherit older queued notices.
 const verifiedAtEvent=contact?.verifiedAt!==null&&contact?.verifiedAt!==undefined&&
  contact.verifiedAt.getTime()<=entry.createdAt.getTime() &&
  contact.consentAt!==null&&contact.consentAt.getTime()<=entry.createdAt.getTime();
 if(!contact||!canNotifyVerifiedParent(contact)||!verifiedAtEvent){
  await db.update(attendanceParentSmsOutbox).set({status:"SKIPPED"}).where(and(
   eq(attendanceParentSmsOutbox.id,id),eq(attendanceParentSmsOutbox.status,"QUEUED")));
  return {status:"SKIPPED" as const};
 }
 // Lease before reaching the provider. A timeout is ambiguous and must not
 // trigger automatic retries without provider idempotency guarantees.
 const [leased]=await db.update(attendanceParentSmsOutbox).set({
  status:"ATTEMPTED",attemptedAt:new Date(),
 }).where(and(eq(attendanceParentSmsOutbox.id,id),
  eq(attendanceParentSmsOutbox.status,"QUEUED"))).returning({id:attendanceParentSmsOutbox.id});
 if(!leased)return {status:"ALREADY_HANDLED" as const};
 const [college]=await db.select({organizationId:colleges.organizationId})
  .from(colleges).where(eq(colleges.id,entry.collegeId)).limit(1);
 // Support ledger entries are scoped to the persisted college rather than
 // relying on the request-context tenant or an unverified phone-to-college map.
 const result=await sendAttendanceParentSms({
  phoneE164:contact.phoneE164,kind:entry.kind as AttendanceParentSmsKind,
  collegeId:entry.collegeId,organizationId:college?.organizationId??null,
  body:attendanceParentSmsBody(entry.kind as AttendanceParentSmsKind,entry.courseName,
   entry.startsAt,entry.endsAt),
 });
 if(result==="ACCEPTED")await db.update(attendanceParentSmsOutbox).set({
  status:"ACCEPTED",acceptedAt:new Date(),
 }).where(and(eq(attendanceParentSmsOutbox.id,id),
  eq(attendanceParentSmsOutbox.status,"ATTEMPTED")));
 if(result==="NOT_CONFIGURED")await db.update(attendanceParentSmsOutbox).set({
  status:"QUEUED",attemptedAt:null,
 }).where(and(eq(attendanceParentSmsOutbox.id,id),
  eq(attendanceParentSmsOutbox.status,"ATTEMPTED")));
 return {status:result};
}

/** Bounded recovery after a missing DLT template is configured. A College
 * Admin explicitly triggers it; the outbox keeps all attempts idempotent. */
export async function retryQueuedAttendanceParentSmsForCollege(ctx:RequestContext,rawCollegeId:unknown){
 const collegeId=z.string().uuid().parse(rawCollegeId);
 await requireAttendanceCollege(ctx,collegeId);
 const ready=await getDb().transaction(async tx=>parentTablesReady(tx));
 if(!ready)return {ready:false,accepted:0,skipped:0,unavailable:0};
 const rows=await getDb().select({id:attendanceParentSmsOutbox.id})
  .from(attendanceParentSmsOutbox).where(and(
   eq(attendanceParentSmsOutbox.collegeId,collegeId),
   eq(attendanceParentSmsOutbox.status,"QUEUED")))
  .orderBy(asc(attendanceParentSmsOutbox.createdAt)).limit(25);
 let accepted=0,skipped=0,unavailable=0;
 for(const row of rows){
  const outcome=await dispatchQueuedAttendanceParentSms(row.id);
  if(outcome.status==="ACCEPTED")accepted++;
  else if(outcome.status==="SKIPPED")skipped++;
  else unavailable++;
 }
 return {ready:true,accepted,skipped,unavailable};
}

/** Privacy-safe migration gate from legacy learner-mobile absence SMS.
 * Never reuse an unverified learner number as a guardian opt-in.
 */
export async function getAttendanceParentSmsReadiness(
 context:RequestContext,raw:unknown,
) {
 const input=z.strictObject({collegeId:z.string().uuid(),membershipId:z.string().uuid()}).parse(raw);
 const college=await requireAttendanceCollege(context,input.collegeId);
 const ready=await getDb().transaction(async tx=>parentTablesReady(tx));
 if(!ready)return {ready:false,canNotify:false,reason:"PARENT_SMS_SCHEMA_NOT_REGISTERED"};
 const [member]=await getDb().select({id:collegeMemberships.id})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER"),
  ))
  .where(and(eq(collegeMemberships.id,input.membershipId),
   eq(collegeMemberships.collegeId,college.id),
   eq(collegeMemberships.status,"ACTIVE"))).limit(1);
 if(!member)return {ready:true,canNotify:false,reason:"LEARNER_NOT_ACTIVE"};
 const [contact]=await getDb().select({
  smsOptIn:attendanceParentContacts.smsOptIn,
  verifiedAt:attendanceParentContacts.verifiedAt,
  consentAt:attendanceParentContacts.consentAt,
  consentEvidenceReference:attendanceParentContacts.consentEvidenceReference,
  phoneE164:attendanceParentContacts.phoneE164,
 }).from(attendanceParentContacts).where(and(
  eq(attendanceParentContacts.collegeId,college.id),
  eq(attendanceParentContacts.membershipId,input.membershipId))).limit(1);
 if(!contact)return {ready:true,canNotify:false,reason:"VERIFIED_PARENT_CONTACT_REQUIRED"};
 if(!canNotifyVerifiedParent(contact))return {
  ready:true,canNotify:false,reason:"PARENT_SMS_CONSENT_REQUIRED",
 };
 return {ready:true,canNotify:true,reason:null};
}
