import { describe,expect,it } from "vitest";
import { verifiedExternalHeldOffers, canAddPlacementHeldOffer } from "@/modules/placements/held-offer-policy";
const reviewedAt = new Date("2026-10-10T00:00:00Z");
const base={status:"VERIFIED",reviewedByUserId:"tpo",reviewedAt,revokedAt:null,ctcLpa:"6.50"};
describe("T-S1-04 verified external offers as held offers",()=>{
 it("uses verified evidence only, with exact LPA-to-INR conversion",()=>{
  expect(verifiedExternalHeldOffers([base,{...base,status:"SUBMITTED"},
    {...base,revokedAt:reviewedAt}, {...base,reviewedByUserId:null}
  ])).toEqual([{kind:"OFFER",status:"ACCEPTED",annualCtcInr:650000}]);
 });
 it("unknown verified CTC still consumes cap without manufacturing uplift",()=>{
  const facts=verifiedExternalHeldOffers([{...base,ctcLpa:null}]);
  expect(facts).toHaveLength(1);
  expect(canAddPlacementHeldOffer({maxHeldOffers:1,upliftPct:40,
   nextAnnualCtcInr:1000000,isDream:false,heldOffers:facts})).toBe(false);
 });
 it("valid verified outside offers participate in uplift threshold",()=>{
  const facts=verifiedExternalHeldOffers([base]);
  expect(canAddPlacementHeldOffer({maxHeldOffers:1,upliftPct:40,
   nextAnnualCtcInr:910000,isDream:false,heldOffers:facts})).toBe(true);
  expect(canAddPlacementHeldOffer({maxHeldOffers:1,upliftPct:40,
   nextAnnualCtcInr:909999,isDream:false,heldOffers:facts})).toBe(false);
 });
});
