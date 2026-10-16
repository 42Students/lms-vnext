import {describe,it,expect} from "vitest";
import {recruiterAccessMonthsOrDefault} from "@/modules/placements/recruiter-access-defaults";
describe("TPO-settings-audit-R01 missing row legacy fallback",()=>{
  it("defaults to six months",()=>{expect(recruiterAccessMonthsOrDefault(null)).toBe(6);expect(recruiterAccessMonthsOrDefault(undefined)).toBe(6);});
  it("preserves configured months but rejects invalid values",()=>{
    expect(recruiterAccessMonthsOrDefault(12)).toBe(12);
    expect(()=>recruiterAccessMonthsOrDefault(61)).toThrow();
    expect(()=>recruiterAccessMonthsOrDefault(0)).toThrow();
  });
});
