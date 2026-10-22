import {describe,expect,it} from "vitest";
import {legacyPlacementFunnelDenominator} from "@/modules/placements/legacy-placement-funnel-denominator";

describe("G2-11-022 registration denominator parity",()=>{
 it("keeps registered learners as the looking step and unique placed learners as the numerator",()=>{
  expect(legacyPlacementFunnelDenominator({registered:40,studentsPlaced:8}))
   .toMatchObject({state:"RECORDED",registered:40,registeredForLegacyStats:40,
    ratePercent:20});
 });
 it("does not invent a conversion percentage for zero registered learners",()=>{
  const result=legacyPlacementFunnelDenominator({registered:0,studentsPlaced:0});
  expect(result).toMatchObject({state:"RECORDED",registered:0,ratePercent:null});
  expect(result.note).toContain("not defined");
 });
 it("keeps a missing or invalid registration tally separate from a legitimate zero",()=>{
  for(const missing of [Number.NaN,Number.POSITIVE_INFINITY,-1]){
   const result=legacyPlacementFunnelDenominator({
    registered:missing,studentsPlaced:5,
   });
   expect(result.state).toBe("UNAVAILABLE");
   expect(result.registered).toBeNull();
   expect(result.ratePercent).toBeNull();
   expect(result.note).toContain("data unavailable");
  }
 });
});
