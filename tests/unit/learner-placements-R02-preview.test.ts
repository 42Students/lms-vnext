import {describe,it,expect} from "vitest";
import {learnerOfferAcceptancePreview} from "@/modules/placements/learner-offer-acceptance-preview";
const item={offerId:"1f0845af-1cd7-40ed-80ef-94de861b7331",companyName:"Company",roleTitle:"Role",jobTitle:"Job",
 annualCtcInr:600000,joiningDate:null,expiresAt:"2099-06-01T10:00:00+05:30",status:"ISSUED" as const};
describe("LEARNER-placements-R02 offer acceptance preview",()=>{
 it("LEARNER-placements-R02 prevents confirm when offer has expired",()=>{
  expect(learnerOfferAcceptancePreview(item,new Date("2099-06-02T00:00:00Z")).canConfirm).toBe(false);
 });
 it("LEARNER-placements-R02 allows confirmation only for currently issued offers",()=>{
  expect(learnerOfferAcceptancePreview(item,new Date("2099-01-01T00:00:00Z")).canConfirm).toBe(true);
  expect(learnerOfferAcceptancePreview({...item,status:"DECLINED"},new Date("2099-01-01T00:00:00Z")).canConfirm).toBe(false);
 });
});