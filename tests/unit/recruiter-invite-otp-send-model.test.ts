import { describe,expect,it } from "vitest";
import { recruiterOtpRequestResult } from "@/modules/placements/recruiter-invite-otp-send-model";
describe("T-S1-03 OTP provider-independent send decision",()=>{
 it("blocks one too many sends for link or shared college",()=>{
  expect(recruiterOtpRequestResult(4,299)).toBe("ALLOW");
  expect(recruiterOtpRequestResult(5,299)).toBe("DENY");
  expect(recruiterOtpRequestResult(4,300)).toBe("ALLOW");
  expect(recruiterOtpRequestResult(4,-1)).toBe("DENY");
  expect(recruiterOtpRequestResult(-1,20)).toBe("DENY");
 });
});
