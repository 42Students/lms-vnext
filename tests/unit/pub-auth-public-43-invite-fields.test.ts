import {describe,it,expect} from "vitest";
import {recruiterInviteAcceptanceBodySchema} from "@/modules/placements/recruiter-invite-otp-accept-model";
import {readFileSync} from "node:fs";
describe("PUB-auth-public-43 REC-calendar-messages-profile-38 recruiter join details",()=>{
 it("permits editable names and valid optional mobiles, never caller supplied email/IDs",()=>{
  const details={code:"123456",name:"Recruiter",designation:"Manager",mobile:"+91 98765 43210"};
  expect(recruiterInviteAcceptanceBodySchema.safeParse(details).success).toBe(true);
  expect(recruiterInviteAcceptanceBodySchema.safeParse({...details,email:"different@example.com"}).success).toBe(false);
  expect(recruiterInviteAcceptanceBodySchema.safeParse({...details,collegeId:"spoof"}).success).toBe(false);
  expect(recruiterInviteAcceptanceBodySchema.safeParse({...details,mobile:"123"}).success).toBe(false);
 });
 it("keeps work email prefilled and locked; details persisted only with verified OTP",()=>{
  const ui=readFileSync("src/components/tpo/recruiter-invite-landing.tsx","utf8");
  const service=readFileSync("src/modules/placements/public-recruiter-invite-accept-service.ts","utf8");
  expect(ui).toContain("From your invitation. You'll sign in with it.");
  expect(service).toContain("recruiterOtpAttemptDecision");
  expect(service).toContain("name:updatedName,designation:updatedDesignation,phoneNorm:updatedPhone");
 });
});
