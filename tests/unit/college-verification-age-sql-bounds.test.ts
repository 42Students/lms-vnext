import {describe,it,expect} from "vitest";
import {matchesVerificationAgeBand,verificationAgeSqlBounds} from "@/modules/verification/queue-age-band";
describe("Verification queue age SQL bounds",()=>{
 const now=new Date("2026-10-15T12:00:00.000Z");
 it("partitions 48 and 168 hour thresholds without overlap",()=>{
  const a=verificationAgeSqlBounds("WITHIN_48_HOURS",now);
  const b=verificationAgeSqlBounds("TWO_TO_SEVEN_DAYS",now);
  const c=verificationAgeSqlBounds("OVER_SEVEN_DAYS",now);
  expect(a.after?.toISOString()).toBe("2026-10-13T12:00:00.000Z");
  expect(a.through).toEqual(now);
  expect(b.through).toEqual(a.after);
  expect(b.after).toEqual(c.through);
  for(const [hours,band] of [[47,"WITHIN_48_HOURS"],[48,"TWO_TO_SEVEN_DAYS"],[167,"TWO_TO_SEVEN_DAYS"],[168,"OVER_SEVEN_DAYS"]] as const)
   expect(matchesVerificationAgeBand(new Date(now.getTime()-hours*3600000),"SUBMITTED",band,now)).toBe(true);
 });
 it("has no bounds for ANY",()=>expect(verificationAgeSqlBounds("ANY",now)).toEqual({}));
});
