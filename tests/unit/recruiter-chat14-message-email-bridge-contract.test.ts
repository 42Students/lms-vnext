import {describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {sendRecruiterMessageDigest} from "@/modules/placements/recruiter-message-email-provider";

const source=(p:string)=>readFileSync(p,"utf8");
describe("REC-calendar-messages-profile-R01 mail bridge deployment and scope",()=>{
 it("REC-calendar-messages-profile-R01 rejects plain HTTP ZeptoMail endpoints without sending bearer credentials",async()=>{
  const transport=vi.fn(async()=>new Response("accepted",{status:202}));
  const result=await sendRecruiterMessageDigest({
   recipient:"recruiter@example.test",recipientName:"Recruiter",collegeName:"College",
   companyName:"Company",replyTo:"r-"+("a".repeat(32))+"@reply.example.com",
   messages:[{body:"Test"}],
  },{
   APP_ENV:"production",RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
   RECRUITER_MESSAGE_REPLY_DOMAIN:"reply.example.com",
   RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"dedicated-digest",
   ZEPTOMAIL_OTP_TEMPLATE_KEY:"other-otp-key",ZEPTOMAIL_TOKEN:"secret",
   ZEPTOMAIL_API_URL:"http://mail.example.test/send",
  },transport as typeof fetch);
  expect(result).toBe(false);
  expect(transport).not.toHaveBeenCalled();
 });
 it("REC-calendar-messages-profile-R01 refuses unsupported Reply-To domains before the provider call",async()=>{
  const transport=vi.fn(async()=>new Response("accepted",{status:202}));
  const result=await sendRecruiterMessageDigest({
   recipient:"recruiter@example.test",recipientName:"Recruiter",collegeName:"College",
   companyName:"Company",replyTo:"r-"+("a".repeat(32))+"@other.example.com",
   messages:[{body:"Test"}],
  },{
   APP_ENV:"production",RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
   RECRUITER_MESSAGE_REPLY_DOMAIN:"reply.example.com",
   RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"dedicated-digest",
   ZEPTOMAIL_OTP_TEMPLATE_KEY:"other-otp-key",ZEPTOMAIL_TOKEN:"secret",
  },transport as typeof fetch);
  expect(result).toBe(false);
  expect(transport).not.toHaveBeenCalled();
 });

 it("REC-calendar-messages-profile-R01 proposed SQL mirrors the Drizzle reply token uniqueness boundary",()=>{
  const db=source("src/db/schema/recruiter-message-email.ts");
  const proposal=source("docs/proposed-migrations/registered-0135/recruiter-message-email-bridge.sql");
  expect(db).toContain('uniqueIndex("recruiter_message_mail_token_uq")');
  expect(db).toContain('sql`'+ "${t.replyTokenHash}" +' is not null`');
  expect(proposal).toContain('CREATE UNIQUE INDEX IF NOT EXISTS recruiter_message_mail_token_uq');
  expect(proposal).toContain('WHERE reply_token_hash IS NOT NULL');
 });
 it("REC-calendar-messages-profile-R01 safeguards inbound email persistence on proposed schema",()=>{
  const db=source("src/db/schema/recruiter-message-email.ts");
  const proposal=source("docs/proposed-migrations/registered-0135/recruiter-message-email-bridge.sql");
  expect(db).toContain('placement_recruiter_inbound_email_events');
  expect(db).toContain('message_id_hash');
  expect(proposal).toContain('message_id_hash varchar(64) NOT NULL UNIQUE');
  expect(proposal).toContain("delivery_channel IN ('APP','EMAIL')");
  expect(proposal).toContain('reply_token_expires_at timestamptz');
 });

 it("REC-calendar-messages-profile-R01 does not dispatch without an inbound reply gateway secret",()=>{
  const code=source("src/modules/placements/recruiter-message-email-dispatch-service.ts");
  expect(code).toContain("RECRUITER_MESSAGE_INBOUND_HMAC_SECRET");
  expect(code).toContain('Buffer.byteLength(inboundSecret,"utf8")<32');
 });
 it("REC-calendar-messages-profile-R01 refuses to send using the OTP template",()=>{
  const code=source("src/modules/placements/recruiter-message-email-dispatch-service.ts");
  expect(code).toContain("templateKey===mailConfig.otpTemplateKey");
  expect(code).toContain("!mailConfig.token");
 });
 it("REC-calendar-messages-profile-R01 does not send before reply aliases are configured",()=>{
  const code=source("src/modules/placements/recruiter-message-email-dispatch-service.ts");
  expect(code).toContain("RECRUITER_MESSAGE_REPLY_TOKEN_SECRET");
  expect(code).toContain("makeRecruiterReplyAddress");
  expect(code).toContain("if(!ready?.ok)");
 });

 it("REC-calendar-messages-profile-R01 does not email messages for a foreign-company job thread",()=>{
  const worker=source("src/modules/placements/recruiter-message-email-dispatch-service.ts");
  expect(worker).toContain("t.job_id is null or exists(select 1 from placement_jobs j");
  expect(worker).toContain("j.company_relationship_id=r.id");
  expect(worker).toContain("r.company_id=p.company_id");
  expect(worker).toContain("r.college_id=t.college_id");
 });
 it("REC-calendar-messages-profile-R01 scopes duplicate provider IDs to the actual authorized thread",()=>{
  const inbound=source("src/modules/placements/recruiter-message-email-inbound-service.ts");
  expect(inbound).toContain('createHash("sha256").update(state.threadId+');
  expect(inbound.indexOf("const msgHash=")).toBeGreaterThan(inbound.indexOf("if(!auth.rows[0])"));
 });
 it("REC-calendar-messages-profile-R01 escapes digest HTML without injecting provider markup",()=>{
  const model=source("src/modules/placements/recruiter-message-email-model.ts");
  expect(model).toContain(".replace(/&/g");
  expect(model).toContain(".replace(/</g");
  expect(model).toContain(".replace(/>/g");
  expect(model).toContain(".replace(/'/g");
 });

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
  // The provider must normalize before applying the outbound allowlist.
  expect(provider).toContain('const recipient=normalizeRecipient("EMAIL",digest.recipient)');
  expect(provider).toContain('canContactRecipientAtRuntime("EMAIL",recipient,env)');
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
  expect(service).toContain("if(!accepted){");
  expect(service).toContain("return false;");
  expect(service).toContain('createHash("sha256").update(token)');
  expect(service).toContain("lastSentAt:now");
  expect(service).toContain('if(!readiness.configured)return {examined:0,sent:0,enabled:false,');
  expect(service).toContain("readinessReason:readiness.reason");
  expect(service).toContain('operatorAlert:"Recruiter email bridge is not ready: "');
 });
 it("REC-calendar-messages-profile-R01 rejects untrusted inbound sender, invalid grant, and replay",()=>{
  const service=source("src/modules/placements/recruiter-message-email-inbound-service.ts");
  expect(service).toContain("verifyRecruiterMailBridgeWithRotation({");
  expect(service).toContain('previousSecret:env["RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_SECRET"]');
  expect(service).toContain('previousExpiresAt:env["RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_UNTIL"]');
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
