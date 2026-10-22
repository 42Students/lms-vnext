import { describe, expect, it } from "vitest";
import { createRecruiterInviteOtp, recruiterInviteOtpSchema,
 recruiterOtpDigest, recruiterOtpMatches, recruiterOtpSendAllowed,
 recruiterOtpUsable } from "@/modules/placements/recruiter-invite-otp-policy";

describe("T-S1-03 invitation OTP safety",()=>{
 const hash="a".repeat(64),secret="a sufficiently long invitation OTP HMAC secret!!";
 it("generates six digits including padding",()=>{
  for(let i=0;i<40;i++)expect(recruiterInviteOtpSchema.safeParse(createRecruiterInviteOtp()).success).toBe(true);
  expect(recruiterInviteOtpSchema.safeParse("12345").success).toBe(false);
  expect(recruiterInviteOtpSchema.safeParse("000001").success).toBe(true);
 });
 it("binds digest to token and compares in constant-time",()=>{
  const d=recruiterOtpDigest(hash,"012345",secret);
  expect(recruiterOtpMatches(d,hash,"012345",secret)).toBe(true);
  expect(recruiterOtpMatches(d,hash,"012346",secret)).toBe(false);
  expect(recruiterOtpMatches(d,"b".repeat(64),"012345",secret)).toBe(false);
  expect(recruiterOtpMatches("not-a-digest",hash,"012345",secret)).toBe(false);
 });
 it("enforces 5/link and 300/college hourly send caps",()=>{
  expect(recruiterOtpSendAllowed(4,299)).toBe(true);
  expect(recruiterOtpSendAllowed(5,0)).toBe(false);
  expect(recruiterOtpSendAllowed(0,300)).toBe(true);
  expect(recruiterOtpSendAllowed(5,300)).toBe(false);
  expect(recruiterOtpSendAllowed(-1,0)).toBe(false);
 });
 it("rejects failed delivery, exact expiry, consumption, fifth wrong guess",()=>{
  const expiry=new Date("2026-10-16T10:10:00Z");
  const base={expiresAt:expiry,failedAttempts:4,consumedAt:null,deliveryState:"SENT" as const};
  expect(recruiterOtpUsable(base,new Date("2026-10-16T10:09:59Z"))).toBe(true);
  expect(recruiterOtpUsable(base,expiry)).toBe(false);
  expect(recruiterOtpUsable({...base,failedAttempts:5},new Date("2026-10-16T10:00:00Z"))).toBe(false);
  expect(recruiterOtpUsable({...base,consumedAt:new Date("2026-10-16T10:00:00Z")},new Date("2026-10-16T10:01:00Z"))).toBe(false);
  expect(recruiterOtpUsable({...base,deliveryState:"PENDING"},new Date("2026-10-16T10:00:00Z"))).toBe(false);
 });
});
