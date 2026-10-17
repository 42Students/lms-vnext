import {describe,it,expect} from "vitest";
import {learnerCollegePlacementRulePoints} from "@/modules/placements/learner-college-placement-rules-model";
import {readFileSync} from "node:fs";
describe("LEARNER-placements-53 authoritative placement rules",()=>{
 const rules={countsAsPlacedAt:"OFFER_RELEASED",maxHeldOffers:1,upliftPct:40,minResponseHours:48};
 it("LEARNER-placements-53 reports saved college limits and truthful held-offer uplift",()=>{
  const view=learnerCollegePlacementRulePoints(rules,[{kind:"OFFER",status:"ISSUED",annualCtcInr:600000}]);
  expect(view.points).toContain("Offers you can hold: up to 1 active offer.");
  expect(view.points.some(point=>point.includes("48 hours"))).toBe(true);
  expect(view.personal).toContain("₹6 LPA");
  expect(view.personal).toContain("₹8.4 LPA");
  expect(view.personal).toContain("Dream");
 });
 it("LEARNER-placements-53 does not disclose unknown CTC as a fabricated uplift",()=>{
  const view=learnerCollegePlacementRulePoints(rules,[{kind:"OFFER",status:"ACCEPTED",annualCtcInr:null}]);
  expect(view.personal).toContain("verified CTC is not recorded");
  expect(view.personal).not.toContain("₹0 LPA");
 });
 it("LEARNER-placements-53 excludes declined offers from held-offer guidance",()=>{
  const view=learnerCollegePlacementRulePoints(rules,[{kind:"OFFER",status:"DECLINED",annualCtcInr:900000}]);
  expect(view.activeOffers).toBe(0);
 });
 it("LEARNER-placements-53 reads only college-scoped policy after membership gate",()=>{
  const service=readFileSync(new URL("../../src/modules/placements/learner-placement-rules-service.ts",import.meta.url),"utf8");
  expect(service).toContain("requireLearnerPlacementAccess(context)");
  expect(service).toContain("eq(placementCollegeRules.collegeId,membership.collegeId)");
  expect(service).toContain("loadPlacementHeldOfferFacts(membership.collegeId,membership.id)");
 });
});
