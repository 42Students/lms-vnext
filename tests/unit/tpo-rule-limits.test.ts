import {describe,expect,it} from "vitest";
import {TPO_RULE_LIMITS,tpoRuleBoundsValid} from "@/modules/placements/tpo-rule-limits";
import {tpoRulesChangeSchema} from "@/modules/placements/tpo-season-write-model";
import {placementCollegeRulesPatchSchema} from "@/modules/placements/tpo-policy-validation";
const base={confirmed:true,expectedVersion:0,countsAsPlacedAt:"OFFER_RELEASED" as const,
 maxHeldOffers:1,upliftPct:40,minResponseHours:48};
describe("TPO-settings-audit-10 legacy rule bounds on both write APIs",()=>{
 it("accepts inclusive min and max for every rule",()=>{
  expect(TPO_RULE_LIMITS).toEqual({maxHeldOffers:{min:1,max:5},
   upliftPct:{min:0,max:200},minResponseHours:{min:12,max:168}});
  for(const values of [{maxHeldOffers:1,upliftPct:0,minResponseHours:12},
   {maxHeldOffers:5,upliftPct:200,minResponseHours:168}]){
   expect(tpoRuleBoundsValid(values)).toBe(true);
   expect(tpoRulesChangeSchema.safeParse({...base,...values}).success).toBe(true);
   expect(placementCollegeRulesPatchSchema.safeParse({collegeId:"11111111-1111-4111-8111-111111111111",expectedVersion:0,...values}).success).toBe(true);
  }
 });
 it("rejects out of bounds at both server schemas and client guard",()=>{
  for(const values of [
   {maxHeldOffers:0,upliftPct:40,minResponseHours:48},
   {maxHeldOffers:6,upliftPct:40,minResponseHours:48},
   {maxHeldOffers:1,upliftPct:-1,minResponseHours:48},
   {maxHeldOffers:1,upliftPct:201,minResponseHours:48},
   {maxHeldOffers:1,upliftPct:40,minResponseHours:11},
   {maxHeldOffers:1,upliftPct:40,minResponseHours:169},
  ]){
   expect(tpoRuleBoundsValid(values)).toBe(false);
   expect(tpoRulesChangeSchema.safeParse({...base,...values}).success).toBe(false);
   expect(placementCollegeRulesPatchSchema.safeParse({collegeId:"11111111-1111-4111-8111-111111111111",expectedVersion:0,...values}).success).toBe(false);
  }
 });
});
