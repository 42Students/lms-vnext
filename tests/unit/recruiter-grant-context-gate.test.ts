import { describe, expect, it } from "vitest";
import { recruiterGrantEffectiveAt } from "@/modules/placements/recruiter-grant-expiry-policy";
/** The persisted context applies these same conjunctive conditions in SQL. */
describe("T-S1-01 protected recruiter context",()=>{
 const date=new Date("2026-10-16T12:00:00Z");
 const base={status:"ACTIVE",validUntil:new Date("2026-10-17T12:00:00Z"),
  verificationStatus:"VERIFIED",capabilities:["DRIVES","MESSAGES"]};
 it("requires verified, unexpired and a drive capability simultaneously",()=>{
  expect(recruiterGrantEffectiveAt(base,date,"DRIVES")).toBe(true);
  expect(recruiterGrantEffectiveAt({...base,capabilities:["MESSAGES"]},date,"DRIVES")).toBe(false);
  expect(recruiterGrantEffectiveAt({...base,verificationStatus:"REJECTED"},date,"DRIVES")).toBe(false);
  expect(recruiterGrantEffectiveAt({...base,validUntil:date},date,"DRIVES")).toBe(false);
 });
});
