import { describe, expect, it } from "vitest";
import { learnerOfferAcceptancePreview } from "@/modules/placements/learner-offer-acceptance-preview";

const offer = {
 offerId:"00000000-0000-4000-8000-000000000001",
 companyName:"College Employer",roleTitle:"Engineer",jobTitle:"Engineer",
 annualCtcInr:null,joiningDate:null,
 expiresAt:"2026-10-15T12:00:00.000Z",status:"ISSUED" as const,
};
describe("learner offer acceptance preview cutoff",()=>{
 it("fails closed at the exact expiration instant",()=>{
  const row=learnerOfferAcceptancePreview(offer,new Date("2026-10-15T12:00:00.000Z"));
  expect(row.expired).toBe(true);
  expect(row.canConfirm).toBe(false);
 });
 it("allows a still-valid issued offer before expiry",()=>{
  expect(learnerOfferAcceptancePreview(offer,new Date("2026-10-15T11:59:59.999Z")).canConfirm).toBe(true);
 });
 it("never confirms on an invalid clock, nor a resolved offer",()=>{
  expect(learnerOfferAcceptancePreview(offer,new Date("invalid")).canConfirm).toBe(false);
  expect(learnerOfferAcceptancePreview({...offer,status:"ACCEPTED"},new Date("2026-10-15T11:00:00Z")).canConfirm).toBe(false);
 });
});