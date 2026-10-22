import {describe,expect,it} from "vitest";
import {mapLegacyEligibilityOverride} from "@/modules/placements/tpo-drive-visibility-bulk-model";

describe("legacy explicit eligibility override migration",()=>{
 it("maps each Boolean and null without truthiness coercion",()=>{
  expect(mapLegacyEligibilityOverride(true)).toEqual({decision:"INCLUDE"});
  expect(mapLegacyEligibilityOverride(false)).toEqual({decision:"EXCLUDE"});
  expect(mapLegacyEligibilityOverride(null)).toEqual({decision:"CLEAR"});
 });
 it("rejects absent, string, number and object instead of mutating state",()=>{
  for(const invalid of [undefined,"false","true",0,1,{},[],{decision:"INCLUDE"}])
   expect(mapLegacyEligibilityOverride(invalid)).toBeNull();
 });
});
