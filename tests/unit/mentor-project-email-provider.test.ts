import {describe,expect,it,vi} from "vitest";
import {mentorProjectEmailAllowed,sendMentorProjectEventEmail}
 from "@/modules/projects/mentor-project-email-provider";
import {resolveZeptoMailTemplateId,readZeptoMailConfig}
 from "@/modules/notifications/zeptomail-email";
const eventId="12345678-1234-4123-8123-123456789abc";
const userId="22345678-1234-4123-8123-123456789abc";
const email={sourceEventId:eventId,recipientUserId:userId,
 recipientEmail:"mentor@example.org",recipientName:"Example Mentor",
 projectTitle:"Capstone",collegeName:"Campus",
 kind:"MEETING_REQUEST" as const,savedOptIn:true};
describe("Mentor project email hard opt-in boundary",()=>{
 it("does not email routine updates, task reviews or announcements",()=>{
  expect(mentorProjectEmailAllowed("TASK_REVIEW",true)).toBe(false);
  expect(mentorProjectEmailAllowed("BLOCKED_TASK",true)).toBe(false);
  expect(mentorProjectEmailAllowed("COLLEGE_ANNOUNCEMENT",true)).toBe(false);
  expect(mentorProjectEmailAllowed("FINAL_SUBMISSION",true)).toBe(true);
  expect(mentorProjectEmailAllowed("MEETING_REQUEST",true)).toBe(true);
  expect(mentorProjectEmailAllowed("FINAL_SUBMISSION",false)).toBe(false);
 });
 it("never sends before persisted opt-in and verified dispatch configuration",async()=>{
  const fetchMock=vi.fn(async()=>{throw new Error("External calls prohibited");});
  expect(await sendMentorProjectEventEmail({...email,savedOptIn:false},{},
    fetchMock as typeof fetch)).toMatchObject({status:"SUPPRESSED",reason:"NOT_OPTED_IN"});
  expect(await sendMentorProjectEventEmail(email,{},fetchMock as typeof fetch))
   .toMatchObject({status:"SUPPRESSED",reason:"DISPATCH_NOT_VERIFIED"});
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("rejects arbitrary or malformed source actor IDs",async()=>{
  const fetchMock=vi.fn();
  const result=await sendMentorProjectEventEmail({...email,sourceEventId:"forged"},{
   MENTOR_PROJECT_EMAIL_DISPATCH_READY:"verified",
   ZEPTOMAIL_IDEMPOTENCY_SUPPORTED:"confirmed",
  },fetchMock as typeof fetch);
  expect(result).toMatchObject({status:"SUPPRESSED",reason:"INVALID_EVENT"});
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("only explicitly configured non-OTP project template IDs can be used",()=>{
  const env={ZEPTOMAIL_OTP_TEMPLATE_KEY:"otp-key",
   ZEPTOMAIL_TEMPLATE_PROJECTS_MEETING_REQUEST:"project-mail"};
  expect(resolveZeptoMailTemplateId({kind:"PROJECTS",templateName:"MEETING_REQUEST"},
   env,readZeptoMailConfig(env))).toBe("project-mail");
  expect(resolveZeptoMailTemplateId({kind:"PROJECTS",templateName:"FINAL_SUBMISSION"},
   env,readZeptoMailConfig(env))).toBeNull();
  const conflict={...env,ZEPTOMAIL_TEMPLATE_PROJECTS_FINAL_SUBMISSION:"otp-key"};
  expect(resolveZeptoMailTemplateId({kind:"PROJECTS",templateName:"FINAL_SUBMISSION"},
   conflict,readZeptoMailConfig(conflict))).toBeNull();
 });
});
