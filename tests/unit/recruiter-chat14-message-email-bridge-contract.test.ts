import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {sendRecruiterMessageDigest} from "@/modules/placements/recruiter-message-email-provider";

const source=(p:string)=>readFileSync(p,"utf8");
describe("REC-calendar-messages-profile-R01 mail bridge deployment and scope",()=>{
 it("REC-calendar-messages-profile-R01 does not send without dedicated template and explicit enablement",async()=>{
  const sent=await sendRecruiterMessageDigest({
    recipient:"recruiter@example.test",recipientName:"Recruiter",companyName:"Company",
    collegeName:"College",replyTo:"r-"+"a".repeat(32)+"@reply.example.com",messages:[{body:"Hi"}],
   },{APP_ENV:"development",AUTH_TEST_EMAILS:"recruiter@example.test",
      RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"false"});
  expect(sent).toBe(false);
 });
 it("REC-calendar-messages-profile-R01 uses safe send, never OTP template, and allowlist outside production",()=>{
  const provider=source("src/modules/placements/recruiter-message-email-provider.ts");
  expect(provider).toContain('canContactRecipientAtRuntime("EMAIL",digest.recipient,env)');
  expect(provider).toContain("key===config.otpTemplateKey");
  expect(provider).toContain("reply_to");
  expect(provider).toContain("safeRecruiterDigestMessages");
  expect(provider).toContain("maxAttempts:1");
 });
 it("REC-calendar-messages-profile-R01 persists reminder cooldown and reply token hashes only after provider success",()=>{
  const service=source("src/modules/placements/recruiter-message-email-dispatch-service.ts");
  expect(service).toContain("isRecruiterUnreadReminderDue");
  expect(service).toContain("onConflictDoNothing()");
  expect(service).toContain('for("update")');
  expect(service).toContain("if(!accepted)return false");
  expect(service).toContain('createHash("sha256").update(token)');
  expect(service).toContain("lastSentAt:now");
  expect(service).toContain("return {examined:0,sent:0,enabled:false}");
 });
 it("REC-calendar-messages-profile-R01 rejects untrusted inbound sender, invalid grant, and replay",()=>{
  const service=source("src/modules/placements/recruiter-message-email-inbound-service.ts");
  expect(service).toContain("verifyRecruiterMailBridgeSignature(secret,rawBody,signature)");
  expect(service).toContain("lower(u.email)=");
  expect(service).toContain("g.verification_status='VERIFIED'");
  expect(service).toContain("g.valid_until > now()");
  expect(service).toContain("'DRIVES'=any(g.capabilities)");
  expect(service).toContain("placementRecruiterInboundEmailEvents.messageIdHash");
  expect(service).toContain("notifyTpoOfRecruiterMessage(tx,");
  expect(service).toContain("delivery_channel");
  expect(service).toContain("if(!ready?.ok)");
 });
 it("REC-calendar-messages-profile-R01 exposes origin-checked, authenticated POST only",()=>{
  for(const file of ["src/app/api/internal/placements/recruiter-message-inbound/route.ts",
    "src/app/api/internal/placements/recruiter-message-reminders/route.ts"]){
    const sourceCode=source(file);
    expect(sourceCode).toContain("export async function POST(");
    expect(sourceCode).toContain("isSameOriginRequest(request)");
    expect(sourceCode).not.toContain("export async function GET(");
  }
 });
});
