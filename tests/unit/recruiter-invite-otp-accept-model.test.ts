import { describe,expect,it } from "vitest";
import { recruiterOtpAttemptDecision } from "@/modules/placements/recruiter-invite-otp-policy";
describe("T-S1-03 transactional OTP attempt outcomes",()=>{
 const now=new Date("2026-10-16T10:00:00Z");
 const challenge={expiresAt:new Date("2026-10-16T10:10:00Z"),
  failedAttempts:3,consumedAt:null,deliveryState:"SENT"};
 it("allows only valid delivered challenges",()=>{
  expect(recruiterOtpAttemptDecision(challenge,now,true)).toBe("ACCEPT");
  expect(recruiterOtpAttemptDecision(challenge,now,false)).toBe("REJECT");
  expect(recruiterOtpAttemptDecision({...challenge,failedAttempts:5},now,true)).toBe("LOCKED");
  expect(recruiterOtpAttemptDecision({...challenge,consumedAt:now},now,true)).toBe("LOCKED");
  expect(recruiterOtpAttemptDecision({...challenge,deliveryState:"FAILED"},now,true)).toBe("LOCKED");
 });
 it("keeps expiry exclusive",()=>{
  expect(recruiterOtpAttemptDecision(challenge,challenge.expiresAt,true)).toBe("LOCKED");
 });
});
