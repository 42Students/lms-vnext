import { it,expect } from "vitest";
import { learnerOffersQueryHasInvalidFields } from "@/modules/placements/learner-offers-query-feedback-model";
it("accepts bounded filters and flags malformed, duplicate or untrusted selectors",()=>{
 expect(learnerOffersQueryHasInvalidFields({status:"accepted",kind:"loi",joining:"joined",page:"12"})).toBe(false);
 for(const raw of [{status:["all","pending"]},{page:"1e3"},{q:"x".repeat(81)},{collegeId:"other"},{focus:"javascript:alert(1)"},{due:"on"}]){
  expect(learnerOffersQueryHasInvalidFields(raw)).toBe(true);
 }
});
