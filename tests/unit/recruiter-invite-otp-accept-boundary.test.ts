import { describe,expect,it } from "vitest";
import {
 recruiterInviteAcceptReady,recruiterInviteAcceptanceBodySchema,
} from "@/modules/placements/recruiter-invite-otp-accept-model";
describe("T-S1-03 authenticated OTP acceptance boundary",()=>{
 it("refuses claimed emails and user IDs",()=>{
  expect(recruiterInviteAcceptanceBodySchema.safeParse({code:"001234"}).success).toBe(true);
  expect(recruiterInviteAcceptanceBodySchema.safeParse({code:"001234",recruiterUserId:"other"}).success).toBe(false);
  expect(recruiterInviteAcceptanceBodySchema.safeParse({code:"001234",email:"someone@other.com"}).success).toBe(false);
  expect(recruiterInviteAcceptanceBodySchema.safeParse({code:"1234"}).success).toBe(false);
 });
 it("requires every independent availability/verification flag",()=>{
  const live={db09:"DB09_VERIFIED",otp:"VERIFIED",grantExpiry:"VERIFIED",delivery:"VERIFIED"};
  expect(recruiterInviteAcceptReady(live)).toBe(true);
  for(const k of Object.keys(live) as (keyof typeof live)[]){
    expect(recruiterInviteAcceptReady({...live,[k]:"PENDING"})).toBe(false);
  }
 });
});
