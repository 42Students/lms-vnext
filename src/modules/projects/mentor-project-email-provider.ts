import "server-only";
import {readZeptoMailConfig,sendZeptoMailTemplate,type ZeptoMailSendResult}
 from "@/modules/notifications/zeptomail-email";

/** Only these two Mentor events can use external email. All routine task
 * comments, blocked alerts, college announcements and weekly updates remain
 * in-app. The dispatch worker must read live saved opt-in and membership first.
 */
export type MentorProjectEmailKind="FINAL_SUBMISSION"|"MEETING_REQUEST";
export function mentorProjectEmailAllowed(kind:string,savedOptIn:boolean):kind is MentorProjectEmailKind{
 return savedOptIn&&(kind==="FINAL_SUBMISSION"||kind==="MEETING_REQUEST");
}
export type MentorProjectEmailDispatch={
 /** Supplied ONLY by persisted activity event and live project-member lookup. */
 sourceEventId:string;recipientUserId:string;recipientEmail:string;
 recipientName:string;projectTitle:string;collegeName:string;
 kind:MentorProjectEmailKind;
 meetingTitle?:string;meetingWhen?:string;
 /** Live stored recipient consent, rechecked after outbox claim. */
 savedOptIn:boolean;
};
export type MentorProjectEmailOutcome=
 {status:"SUPPRESSED";reason:"NOT_OPTED_IN"|"DISPATCH_NOT_VERIFIED"|"INVALID_EVENT"}|
 {status:"ATTEMPTED";provider:ZeptoMailSendResult};
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const clean=(text:string,max=160)=>text.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu," ")
 .replace(/\s+/g," ").trim().slice(0,max);

/** Must be invoked only from a durable claimed outbox worker, NEVER inside
 * the business transaction. An upstream ACCEPTED receipt is not inbox delivery.
 * No send occurs without opt-in, operator verification and idempotent provider.
 */
export async function sendMentorProjectEventEmail(
 input:MentorProjectEmailDispatch,
 env:Record<string,string|undefined>=process.env,
 fetchImpl:typeof fetch=fetch,
):Promise<MentorProjectEmailOutcome>{
 if(!mentorProjectEmailAllowed(input.kind,input.savedOptIn))
  return {status:"SUPPRESSED",reason:"NOT_OPTED_IN"};
 if(!uuid.test(input.sourceEventId)||!uuid.test(input.recipientUserId))
  return {status:"SUPPRESSED",reason:"INVALID_EVENT"};
 if(env["MENTOR_PROJECT_EMAIL_DISPATCH_READY"]!=="verified"||
  env["ZEPTOMAIL_IDEMPOTENCY_SUPPORTED"]!=="confirmed")
  return {status:"SUPPRESSED",reason:"DISPATCH_NOT_VERIFIED"};
 const projectName=clean(input.projectTitle,160);
 const recipientName=clean(input.recipientName,120)||"Mentor";
 const subject=input.kind==="FINAL_SUBMISSION"?"Project final delivery submitted":
  "Project meeting requested";
 const mergeInfo={
  name:recipientName,projectName,collegeName:clean(input.collegeName),
  subject,meetingTitle:clean(input.meetingTitle??""),
  meetingWhen:clean(input.meetingWhen??""),
  // The source event ID is opaque and never an external action URL.
 };
 const idempotencyKey="projects:"+input.sourceEventId+":"+input.recipientUserId;
 const provider=await sendZeptoMailTemplate({
  purpose:{kind:"PROJECTS",templateName:input.kind},
  toEmail:input.recipientEmail,recipientName,
  mergeInfo,idempotencyKey,
 },readZeptoMailConfig(env),fetchImpl,env);
 return {status:"ATTEMPTED",provider};
}
