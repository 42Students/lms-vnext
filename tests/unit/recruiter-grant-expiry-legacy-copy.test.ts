import {describe,expect,it} from "vitest";
import {buildRecruiterSelfGrantRows} from "@/modules/placements/recruiter-self-grants-model";
describe("REC-calendar-messages-profile-29 recruiter grant expiry",()=>{
 const base={id:"550e8400-e29b-41d4-a716-446655440000",collegeName:"Example College",
  grantStatus:"ACTIVE",relationshipStatus:"ACTIVE",grantedAt:new Date("2026-01-01T00:00:00Z")};
 it("displays the exact legacy access-until phrase for an authorized active grant",()=>{
  const rows=buildRecruiterSelfGrantRows([{...base,validUntil:new Date("2027-01-30T12:00:00Z")}]);
  expect(rows[0]?.accessExpiryLabel).toBe("Access until 30 Jan 2027. The placement cell can extend it.");
  expect(rows[0]?.validUntilIso).toBe("2027-01-30T12:00:00.000Z");
 });
 it("uses the legacy no-expiry wording for an unset valid_until",()=>{
  expect(buildRecruiterSelfGrantRows([{...base,validUntil:null}])[0]?.accessExpiryLabel).toBe("Access has no end date");
 });
 it("does not reveal revoked or inactive relationship records",()=>{
  expect(buildRecruiterSelfGrantRows([{...base,validUntil:null,grantStatus:"REVOKED"}])).toEqual([]);
  expect(buildRecruiterSelfGrantRows([{...base,validUntil:null,relationshipStatus:"INACTIVE"}])).toEqual([]);
 });
});
