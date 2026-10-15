import { describe,expect,it } from "vitest";
import { recruiterGrantValidUntil, recruiterGrantEffectiveAt } from "@/modules/placements/recruiter-grant-expiry-policy";
describe("T-S1-01 time-limited TPO grant issuance",()=>{
 it("never grants indefinite access without a configured duration",()=>{
  expect(()=>recruiterGrantValidUntil(new Date("2026-10-16T00:00:00Z"),0)).toThrow();
  const expiry=recruiterGrantValidUntil(new Date("2026-10-16T00:00:00Z"),12);
  expect(expiry.toISOString()).toBe("2027-10-16T00:00:00.000Z");
  expect(recruiterGrantEffectiveAt({status:"ACTIVE",validUntil:expiry,
   verificationStatus:"VERIFIED",capabilities:["DRIVES"]},expiry)).toBe(false);
 });
});
