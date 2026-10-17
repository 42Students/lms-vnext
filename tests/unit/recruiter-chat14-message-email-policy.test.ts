import {describe,expect,it} from "vitest";
import {isRecruiterUnreadReminderDue,safeRecruiterDigestMessages,makeRecruiterReplyAddress,
 recruiterMailBridgeSignature,verifyRecruiterMailBridgeSignature}
 from "@/modules/placements/recruiter-message-email-model";
const T=Date.parse("2099-01-01T00:00:00Z");
const at=(m:number)=>new Date(T+m*60_000);
describe("REC-calendar-messages-profile-R01 unread recruiter mail policy",()=>{
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
