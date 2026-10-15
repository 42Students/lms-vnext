import {describe,it,expect} from "vitest";
import {learnerOffersCsv,LEARNER_OFFER_CSV_LIMIT} from "@/modules/placements/learner-offers-csv-model";
describe("own learner offer exports",()=>{
 it("returns only bounded displayed offers without mutating their order",()=>{
  const rows=Array.from({length:LEARNER_OFFER_CSV_LIMIT+2},(_,i)=>({
   offerId:"offer-"+i,applicationId:"app",companyName:"Employer "+i,
   jobTitle:"Software",roleTitle:"Engineer",status:"ISSUED" as const,
   annualCtcInr:500000,joiningDate:null,expiresAt:null,
   issuedAt:"2026-10-15T00:00:00Z",joining:null,
  }));
  const csv=learnerOffersCsv(rows);
  expect(csv).toContain("Employer 999");
  expect(csv).not.toContain("Employer 1000");
  expect(rows).toHaveLength(1002);
 });
});
