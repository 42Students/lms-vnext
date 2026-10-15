import { describe, expect, it } from "vitest";
import { summarizeBatchEligibility, batchEligibilityNextAction } from "@/modules/placements/tpo-batch-eligibility-summary-model";
import type { PlacementScopeDecision } from "@/modules/placements/batch-eligibility-policy";
const decision=(status:"ELIGIBLE"|"INELIGIBLE"):PlacementScopeDecision=>({status,reason:status==="INELIGIBLE"?"Not taking part":null,note:null,decidedAt:new Date("2026-10-15T08:00:00Z")});
describe("TPO batch inherited eligibility",()=>{
 it("uses learner over class over cohort, never counts ambiguous classes as decided",()=>{
  const out=summarizeBatchEligibility([
   {membershipId:"one",sectionIds:["s"]},{membershipId:"two",sectionIds:["s"]},
   {membershipId:"three",sectionIds:[]},{membershipId:"four",sectionIds:["s","t"]},
  ],{learner:new Map([["one",decision("INELIGIBLE")]]),
   section:new Map([["s",decision("ELIGIBLE")]]),cohort:decision("INELIGIBLE")},false);
  expect(out).toEqual({eligible:1,ineligible:2,undecided:0,needsReview:1,assessed:4,complete:true});
  expect(batchEligibilityNextAction(out,false)).toBe("REVIEW");
 });
 it("does not call a capped sample a complete batch",()=>{
  const out=summarizeBatchEligibility([{membershipId:"a",sectionIds:[]}],
   {learner:new Map(),section:new Map(),cohort:null},true);
  expect(out.undecided).toBe(1);
  expect(batchEligibilityNextAction(out,false)).toBe("REVIEW");
 });
});
