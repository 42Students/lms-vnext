import {describe,it,expect,vi} from "vitest";
import {recruiterInviteAcceptReady} from "@/modules/placements/recruiter-invite-otp-accept-model";
import {recruiterOtpSendAllowed} from "@/modules/placements/recruiter-invite-otp-policy";
describe("PUB-auth-public-41 REC-calendar-messages-profile-38 invitation send-code",()=>{
 it("blocks requests unless DB OTP and delivery are verified",()=>{
  expect(recruiterInviteAcceptReady({db09:"DB09_VERIFIED",otp:"VERIFIED",delivery:"VERIFIED"})).toBe(true);
  expect(recruiterInviteAcceptReady({db09:"DB09_VERIFIED",otp:"VERIFIED",delivery:undefined})).toBe(false);
 });
 it("limits code requests per token and college",()=>{
  expect(recruiterOtpSendAllowed(5,0)).toBe(false);
  expect(recruiterOtpSendAllowed(0,300)).toBe(false);
  expect(recruiterOtpSendAllowed(4,299)).toBe(true);
 });
});
