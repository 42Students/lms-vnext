import {describe,it,expect} from "vitest";
import {recruiterOtpAttemptDecision,recruiterOtpDigest} from "@/modules/placements/recruiter-invite-otp-policy";
import {recruiterInviteAcceptanceBodySchema} from "@/modules/placements/recruiter-invite-otp-accept-model";
describe("PUB-auth-public-40 PUB-auth-public-42 REC-calendar-messages-profile-38 public OTP accept",()=>{
 const secret="test-secret-1234567890123456789012345",hash="c".repeat(64),code="123456";
 it("rejects any caller-supplied identity or college ID",()=>{
  expect(recruiterInviteAcceptanceBodySchema.safeParse({code}).success).toBe(true);
  expect(recruiterInviteAcceptanceBodySchema.safeParse({code,userId:"spoof"}).success).toBe(false);
  expect(recruiterInviteAcceptanceBodySchema.safeParse({code,collegeId:"spoof"}).success).toBe(false);
 });
 it("only accepts a live delivered, unused, correct code",()=>{
  const now=new Date("2026-10-16T12:00:00Z");
  const state={expiresAt:new Date("2026-10-16T12:10:00Z"),failedAttempts:0,
   consumedAt:null,deliveryState:"SENT"};
  expect(recruiterOtpAttemptDecision(state,now,true)).toBe("ACCEPT");
  expect(recruiterOtpAttemptDecision(state,now,false)).toBe("REJECT");
  expect(recruiterOtpAttemptDecision({...state,consumedAt:now},now,true)).toBe("LOCKED");
  expect(recruiterOtpAttemptDecision({...state,expiresAt:now},now,true)).toBe("LOCKED");
  expect(recruiterOtpDigest(hash,code,secret)).toMatch(/^[a-f0-9]{64}$/);
 });
});
