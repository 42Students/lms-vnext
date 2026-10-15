import {describe,expect,it} from "vitest";
import {learnerOfferStatusTabLabel} from "@/modules/placements/learner-offer-status-label-model";
import {browseOwnLearnerOffers} from "@/modules/placements/learner-offers-browse-model";
describe("learner issued-offer filter truth",()=>{
 it("does not say every stored ISSUED offer is awaiting response",()=>{
  expect(learnerOfferStatusTabLabel("pending")).toContain("check deadline");
  expect(learnerOfferStatusTabLabel("pending")).not.toContain("Awaiting");
 });
 it("keeps expired issued offers in recorded status history for review",()=>{
  const rows=[{offer:{id:"a",status:"ISSUED",issuedAt:new Date("2026-10-01"),expiresAt:new Date("2026-10-02")}}];
  expect(browseOwnLearnerOffers(rows,"pending").items).toHaveLength(1);
 });
});