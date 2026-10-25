import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterReplyTokenForThread,makeRecruiterReplyAddress,isRecruiterReplyAddress,
 recruiterMailBridgeSignature,verifyRecruiterMailBridgeSignature,extractRecruiterEmailReply,
 safeRecruiterEmailMergeText,safeRecruiterDigestMessages,isRecruiterUnreadReminderDue}
 from "@/modules/placements/recruiter-message-email-model";
const read=(path:string)=>readFileSync(path,"utf8");
const secret="h".repeat(64);
const thread="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const minutes=(n:number)=>new Date(Date.parse("2099-01-01T00:00:00Z")+n*60000);

describe("chat-16 recruiter email bridge security and resend policy",()=>{
 it("email-bridge-token-01 uses purpose- and thread-bound opaque tokens",()=>{
  const token=recruiterReplyTokenForThread(secret,thread);
  expect(token).toMatch(/^[a-f0-9]{32}$/);
  expect(recruiterReplyTokenForThread(secret,thread)).toBe(token);
  expect(recruiterReplyTokenForThread(secret,other)).not.toBe(token);
  expect(recruiterReplyTokenForThread("short",thread)).toBeNull();
  expect(recruiterReplyTokenForThread(secret,"invalid")).toBeNull();
 });
 it("email-bridge-reply-address-01 rejects external and malformed Reply-To domains",()=>{
  const token=recruiterReplyTokenForThread(secret,thread)!;
  const address=makeRecruiterReplyAddress(token,"reply.example.org");
  expect(address).toBe("r-"+token+"@reply.example.org");
  expect(isRecruiterReplyAddress(address!,"reply.example.org")).toBe(true);
  expect(isRecruiterReplyAddress(address!,"other.example.org")).toBe(false);
  expect(makeRecruiterReplyAddress(token,"example.org@evil.test")).toBeNull();
  expect(makeRecruiterReplyAddress(token,"localhost")).toBeNull();
  expect(makeRecruiterReplyAddress("invalid","reply.example.org")).toBeNull();
  expect(makeRecruiterReplyAddress(token,"-spoof.example.org")).toBeNull();
  expect(makeRecruiterReplyAddress(token,"spoof-.example.org")).toBeNull();
  expect(makeRecruiterReplyAddress(token,"a".repeat(64)+".example.org")).toBeNull();
  expect(makeRecruiterReplyAddress(token,Array.from({length:6},()=>"a".repeat(48)).join(".")+".org")).toBeNull();
  expect(makeRecruiterReplyAddress(token,"reply.EXAMPLE.ORG")).toBe(address);
  expect(isRecruiterReplyAddress("r-"+token+"@-spoof.example.org","-spoof.example.org")).toBe(false);
 });
 it("email-bridge-hmac-01 authenticates exact upstream bytes, including whitespace",()=>{
  const body='{"from":"a@example.org","message":"Hi"}';
  const sig=recruiterMailBridgeSignature(secret,body);
  expect(verifyRecruiterMailBridgeSignature(secret,body,sig)).toBe(true);
  expect(verifyRecruiterMailBridgeSignature(secret,body+" ",sig)).toBe(false);
  expect(verifyRecruiterMailBridgeSignature("short",body,sig)).toBe(false);
  expect(verifyRecruiterMailBridgeSignature(secret,body,sig.slice(1))).toBe(false);
 });
 it("email-bridge-quote-01 never repeats private quoted thread content",()=>{
  expect(extractRecruiterEmailReply("Thanks for reviewing.\r\n\r\nOn Wednesday, January 1 wrote:\r\nsecret")).toBe("Thanks for reviewing.");
  expect(extractRecruiterEmailReply("New answer\n-----Original Message-----\nold")).toBe("New answer");
  expect(extractRecruiterEmailReply("> quoted only")).toBeNull();
  expect(extractRecruiterEmailReply("")).toBeNull();
  expect(extractRecruiterEmailReply("x".repeat(20001))).toBe("x".repeat(4000));
  expect(extractRecruiterEmailReply("x".repeat(200001))).toBeNull();
  expect(extractRecruiterEmailReply("A\u0000B")).toBe("AB");
  // REC-calendar-messages-profile-R01: forwarded history and Outlook-style
  // headers must never be persisted as a new recruiter message.
  expect(extractRecruiterEmailReply("New answer\nBegin forwarded message:\nprivate history")).toBe("New answer");
  expect(extractRecruiterEmailReply("New answer\n---- Forwarded message ----\nprivate history")).toBe("New answer");
  expect(extractRecruiterEmailReply("New answer\nSent: 18 October 2026 15:00\nprivate history")).toBe("New answer");
  expect(extractRecruiterEmailReply("Begin forwarded message:\nprivate history")).toBeNull();
 });
 it("email-bridge-escape-01 bounds and escapes provider template merge variables",()=>{
  expect(safeRecruiterEmailMergeText("<a>&\"'")).toBe("&lt;a&gt;&amp;&quot;&#39;");
  expect(safeRecruiterEmailMergeText("&",3)).toBe("");
  expect(safeRecruiterEmailMergeText("z".repeat(5000))).toHaveLength(4000);
  expect(safeRecruiterDigestMessages([{body:"1"},{body:"2"},{body:"3"},{body:"4"}])).toEqual(["2","3","4"]);
 });
 it("email-bridge-unread-01 honors the quiet period, first reminder and six-hour cooldown",()=>{
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:minutes(0),lastMessageAt:minutes(12),lastSentAt:null,now:minutes(17)})).toBe(true);
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:minutes(0),lastMessageAt:minutes(19),lastSentAt:null,now:minutes(20)})).toBe(false);
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:minutes(0),lastMessageAt:minutes(45),lastSentAt:null,now:minutes(46)})).toBe(true);
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:minutes(0),lastMessageAt:minutes(12),lastSentAt:minutes(15),now:minutes(20)})).toBe(false);
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:minutes(10),lastMessageAt:minutes(5),lastSentAt:null,now:minutes(30)})).toBe(false);
 });
 it("email-bridge-inbound-01 requires signed gateway, live college grants and per-thread deduplication",()=>{
  const inbound=read("src/modules/placements/recruiter-message-email-inbound-service.ts");
  expect(inbound).toContain("verifyRecruiterMailBridgeWithRotation({");
  expect(inbound).toContain("body:rawBody,signature,currentSecret:secret");
  expect(inbound).toContain('previousSecret:env["RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_SECRET"]');
  expect(inbound).toContain('previousExpiresAt:env["RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_UNTIL"]');
  expect(inbound).toContain("RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED");
  expect(inbound).toContain("g.verification_status='VERIFIED'");
  expect(inbound).toContain("'DRIVES'=any(g.capabilities)");
  expect(inbound).toContain("rel.college_id=t.college_id");
  expect(inbound).toContain("lower(u.email)");
  expect(inbound).toContain("state.replyTokenExpiresAt<=new Date()");
  expect(inbound).toContain('.for("update")');
  expect(inbound).toContain("state.threadId+");
  expect(inbound).toContain("placementRecruiterInboundEmailEvents.messageIdHash");
 });
 it("email-bridge-outbound-01 never retries non-idempotent provider sends",()=>{
  const provider=read("src/modules/placements/recruiter-message-email-provider.ts");
  const worker=read("src/modules/placements/recruiter-message-email-dispatch-service.ts");
  expect(provider).toContain("canContactRecipientAtRuntime");
  expect(provider).toContain("isRecruiterReplyAddress");
  expect(provider).toContain("timeoutMs:10_000,maxAttempts:1");
  expect(provider).toContain("safeRecruiterDigestMessages");
  expect(worker).toContain("RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY");
  expect(worker).toContain("state.lastSentAt");
  expect(worker).toContain("replyTokenHash");
 });
});
