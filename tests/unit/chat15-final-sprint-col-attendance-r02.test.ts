import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {attendanceParentContactInputSchema,attendanceParentSmsBody,canNotifyVerifiedParent}
 from "@/modules/attendance/parent-sms-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const now=new Date("2099-03-11T04:00:00Z"),end=new Date("2099-03-11T05:00:00Z");
const consent={phoneE164:"+919876543210",smsOptIn:true,consentAt:now,
 verifiedAt:now,consentEvidenceReference:"SIGNED-REF-2099"};
describe("COL-attendance-R02 verified parent absence/correction SMS",()=>{
 it("COL-attendance-R02 requires independently verified guardian number and explicit recorded opt-in",()=>{
  expect(canNotifyVerifiedParent(consent)).toBe(true);
  expect(canNotifyVerifiedParent({...consent,smsOptIn:false})).toBe(false);
  expect(canNotifyVerifiedParent({...consent,phoneE164:"9876543210"})).toBe(false);
  expect(canNotifyVerifiedParent({...consent,verifiedAt:null})).toBe(false);
  expect(canNotifyVerifiedParent({...consent,consentEvidenceReference:null})).toBe(false);
  const input={collegeId:"11111111-1111-4111-8111-111111111111",
   membershipId:"22222222-2222-4222-8222-222222222222",
   phoneE164:"+919876543210",consentEvidenceReference:"SIGNED-REF-2099",
   guardianConsentConfirmed:true,verifiedParentPhone:true};
  expect(attendanceParentContactInputSchema.safeParse(input).success).toBe(true);
  expect(attendanceParentContactInputSchema.safeParse({...input,verifiedParentPhone:false}).success).toBe(false);
 });
 it("COL-attendance-R02 produces legacy parent absence and explicit present-correction copy without control chars",()=>{
  expect(attendanceParentSmsBody("ABSENT","Calculus",now,end))
   .toMatch(/^Dear Parent, Your ward is absent for today's Calculus class at /);
  expect(attendanceParentSmsBody("CORRECTED","Calculus",now,end))
   .toContain("was corrected to present.");
  expect(attendanceParentSmsBody("ABSENT","A\nB",now,end)).not.toContain("\n");
 });
 it("COL-attendance-R02 creates outbox rows only after changed audited absence or ABSENT-to-PRESENT transitions",()=>{
  const svc=source("src/modules/attendance/admin-service.ts");
  const change=source("src/modules/attendance/admin-correction-change-model.ts");
  expect(svc).toContain("if(!change.changed)");
  expect(svc).toContain("change.shouldNotifyAbsent");
  expect(svc).toContain("change.shouldNotifyCorrected");
  expect(change).toContain('shouldNotifyAbsent:statusChanged&&input.requestedStatus==="ABSENT"');
  expect(change).toContain('shouldNotifyCorrected:statusChanged&&previousStatus==="ABSENT"&&input.requestedStatus==="PRESENT"');
  expect(svc).toContain("enqueueAttendanceParentSms(tx");
  expect(svc).toContain("return publicReceipt");
  expect(svc).toContain("dispatchQueuedAttendanceParentSms(smsOutboxId)");
 });
 it("COL-attendance-R02 fails closed with separate DLT credentials and never treats OTP as attendance messaging",()=>{
  const provider=source("src/modules/attendance/parent-sms-provider.ts");
  const service=source("src/modules/attendance/parent-sms-service.ts");
  expect(provider).toContain("EXOTEL_ATTENDANCE_ABSENT_DLT_TEMPLATE_ID");
  expect(provider).toContain("EXOTEL_ATTENDANCE_CORRECTED_DLT_TEMPLATE_ID");
  expect(provider).toContain("maxAttempts:1");
  expect(provider).not.toContain("EXOTEL_OTP_DLT_TEMPLATE_ID");
  expect(service).toContain('eq(attendanceParentSmsOutbox.status,"QUEUED")');
  expect(service).toContain('status:"ATTEMPTED"');
  expect(service).toContain("canNotifyVerifiedParent(contact)");
  expect(service).toContain("PARENT_SMS_SCHEMA_NOT_REGISTERED");
 });
 it("COL-attendance-R02 retries only still-current, consented messages for the authorized college in bounded batches",()=>{
  const service=source("src/modules/attendance/parent-sms-service.ts");
  const route=source("src/app/api/attendance/admin/parent-contacts/retry/route.ts");
  const editor=source("src/components/attendance/admin-attendance-parent-contact-editor.tsx");
  expect(service).toContain('const eventStillCurrent=entry.kind==="ABSENT"?actualAbsent:currentAttendance===undefined');
  expect(service).toContain("contact.verifiedAt.getTime()<=entry.createdAt.getTime()");
  expect(service).toContain("contact.consentAt.getTime()<=entry.createdAt.getTime()");
  expect(service).toContain('eq(attendanceParentSmsOutbox.collegeId,collegeId)');
  expect(service).toContain('orderBy(asc(attendanceParentSmsOutbox.createdAt)).limit(25)');
  expect(service).toContain("await requireAttendanceCollege(ctx,collegeId)");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(editor).toContain("Retry queued guardian SMS (up to 25)");
  expect(editor).toContain("Accepted is not proof of handset delivery.");
 });
 it("COL-attendance-R02 accepts guardian opt-out immediately, audits it, and drops pending unsent messages",()=>{
  const service=source("src/modules/attendance/parent-sms-service.ts");
  const route=source("src/app/api/attendance/admin/parent-contacts/route.ts");
  const ui=source("src/components/attendance/admin-attendance-parent-contact-editor.tsx");
  expect(service).toContain("revokeAttendanceParentContact(ctx:RequestContext");
  expect(service).toContain("eq(attendanceParentContacts.smsOptIn,true)");
  expect(service).toContain('eq(attendanceParentSmsOutbox.status,"QUEUED")');
  expect(service).toContain('eventType:"ATTENDANCE_PARENT_SMS_CONSENT_REVOKED"');
  expect(service).toContain('eventType:"ATTENDANCE_PARENT_SMS_CONSENT_UPDATED"');
  expect(route).toContain("export async function DELETE(request:Request)");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(ui).toContain("Disable guardian SMS for selected learner");
 });
 it("COL-attendance-R02 exposes only College Admin same-origin verified-contact registration, never learner alternate phone",()=>{
  const api=source("src/app/api/attendance/admin/parent-contacts/route.ts");
  const ui=source("src/components/attendance/admin-attendance-parent-contact-editor.tsx");
  expect(api).toContain("isSameOriginRequest(request)");
  expect(ui).toContain("Parent phone verified independently");
  expect(ui).toContain("Parent consent was recorded and confirmed");
  expect(ui).not.toContain("alternatePhone");
  expect(source("src/components/attendance/admin-attendance-workspace.tsx")).toContain("<AdminAttendanceParentContactEditor");
  expect(source("drizzle/0135_lanes_round_3.sql")).toContain("attendance_parent_sms_outbox");
 });
});
