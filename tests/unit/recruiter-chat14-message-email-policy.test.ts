import {describe,expect,it} from "vitest";
import {isRecruiterUnreadReminderDue,safeRecruiterDigestMessages,makeRecruiterReplyAddress,
 recruiterMailBridgeSignature,verifyRecruiterMailBridgeSignature,extractRecruiterEmailReply,recruiterReplyTokenForThread,safeRecruiterEmailMergeText}
 from "@/modules/placements/recruiter-message-email-model";
const T=Date.parse("2099-01-01T00:00:00Z");
const at=(m:number)=>new Date(T+m*60_000);
describe("REC-calendar-messages-profile-R01 unread recruiter mail policy",()=>{
 it("REC-calendar-messages-profile-R01 HTML-escapes all email template fields",()=>{
  expect(safeRecruiterEmailMergeText('<b>College & "Company" \'Hiring\'</b>'))
   .toBe('&lt;b&gt;College &amp; &quot;Company&quot; &#39;Hiring&#39;&lt;/b&gt;');
 });
 it("REC-calendar-messages-profile-R01 strips control characters from digest titles",()=>{
  expect(safeRecruiterEmailMergeText("Hi\\nWorld\\r".replace(/\\\\n/g,"\\n").replace(/\\\\r/g,"\\r"),100)).toBe("Hi World");
 });
 it("REC-calendar-messages-profile-R01 bounds untrusted recruiter college names",()=>{
  expect(safeRecruiterEmailMergeText("x".repeat(300),160)).toHaveLength(160);
 });

 it("REC-calendar-messages-profile-R01 preserves Reply-To aliases across digest deliveries",()=>{
  const secret="unit-test-dedicated-opaque-token-secret-more-than-32";
  const id="11111111-2222-4333-8444-555555555555";
  const first=recruiterReplyTokenForThread(secret,id);
  expect(first).toMatch(/^[a-f0-9]{32}$/);
  expect(recruiterReplyTokenForThread(secret,id)).toBe(first);
  expect(recruiterReplyTokenForThread(secret,"11111111-2222-4333-8444-555555555556")).not.toBe(first);
 });
 it("REC-calendar-messages-profile-R01 fails closed for invalid thread and weak secret",()=>{
  expect(recruiterReplyTokenForThread("short","11111111-2222-4333-8444-555555555555")).toBe(null);
  expect(recruiterReplyTokenForThread("x".repeat(32),"not-a-uuid")).toBe(null);
 });
 it("REC-calendar-messages-profile-R01 derives opaque tokens and never stores raw reply secrets",()=>{
  const model=readFileSync("src/modules/placements/recruiter-message-email-model.ts","utf8");
  const worker=readFileSync("src/modules/placements/recruiter-message-email-dispatch-service.ts","utf8");
  expect(model).toContain('recruiter-reply:v1:');
  expect(worker).toContain("RECRUITER_MESSAGE_REPLY_TOKEN_SECRET");
  expect(worker).toContain("recruiterReplyTokenForThread(replySecret,candidate.thread_id)");
  expect(worker).toContain('createHash("sha256").update(token)');
  expect(worker).not.toContain('randomBytes(16).toString("hex")');
 });

 it("REC-calendar-messages-profile-R01 extracts reply without duplicating quoted TPO conversation",()=>{
  expect(extractRecruiterEmailReply("Yes, Thursday works.\nOn Tue, Oct 18 someone wrote:\n> Confidential history"))
   .toBe("Yes, Thursday works.");
  expect(extractRecruiterEmailReply("Accepted\n-- \nSent from my phone"))
   .toBe("Accepted");
  expect(extractRecruiterEmailReply("Okay\n-----Original Message-----\nFrom: TPO"))
   .toBe("Okay");
 });
 it("REC-calendar-messages-profile-R01 rejects all-quoted and forwarded replies",()=>{
  expect(extractRecruiterEmailReply("> Previous message\n> Confidential history")).toBe(null);
  expect(extractRecruiterEmailReply("-----Original Message-----\nMessage")).toBe(null);
  expect(extractRecruiterEmailReply(" ".repeat(30))).toBe(null);
 });
 it("REC-calendar-messages-profile-R01 preserves new multiline replies while rejecting oversize",()=>{
  expect(extractRecruiterEmailReply("Line 1\r\nLine 2")).toBe("Line 1\nLine 2");
  expect(extractRecruiterEmailReply("x".repeat(4001))).toBe(null);
  expect(extractRecruiterEmailReply("x".repeat(20001))).toBe(null);
 });

 it("REC-calendar-messages-profile-R01 waits at least fifteen minutes and a two-minute quiet period",()=>{
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:at(0),lastMessageAt:at(14),lastSentAt:null,now:at(15)})).toBe(false);
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:at(0),lastMessageAt:at(14),lastSentAt:null,now:at(16)})).toBe(true);
 });
 it("REC-calendar-messages-profile-R01 caps perpetual message activity at forty-five minutes",()=>{
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:at(0),lastMessageAt:at(44),lastSentAt:null,now:at(45)})).toBe(true);
 });
 it("REC-calendar-messages-profile-R01 prevents repeated digests for six hours",()=>{
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:at(0),lastMessageAt:at(14),lastSentAt:at(20),now:at(300)})).toBe(false);
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:at(0),lastMessageAt:at(14),lastSentAt:at(20),now:at(380)})).toBe(true);
 });
 it("REC-calendar-messages-profile-R01 keeps only latest three sanitized message excerpts",()=>{
  expect(safeRecruiterDigestMessages(["a","b","c","d"].map(body=>({body})))).toEqual(["b","c","d"]);
  expect(safeRecruiterDigestMessages([{body:"a\nsubject"}])).toEqual(["a subject"]);
 });
 it("REC-calendar-messages-profile-R01 rejects forged webhook signatures and malformed reply aliases",()=>{
  const secret="safe-but-test-only-secret-of-more-than-32-characters";
  const body='{"from":"x@example.test","text":"reply"}';
  const signature=recruiterMailBridgeSignature(secret,body);
  expect(verifyRecruiterMailBridgeSignature(secret,body,signature)).toBe(true);
  expect(verifyRecruiterMailBridgeSignature(secret,body+"!",signature)).toBe(false);
  expect(verifyRecruiterMailBridgeSignature("short",body,signature)).toBe(false);
  expect(makeRecruiterReplyAddress("a".repeat(32),"reply.example.com")).toBe("r-"+"a".repeat(32)+"@reply.example.com");
  expect(makeRecruiterReplyAddress("../oops","reply.example.com")).toBe(null);
 });
});
