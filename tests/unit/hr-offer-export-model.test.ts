import {describe,expect,it} from "vitest";
import {buildHrOfferCsv,HR_OFFER_EXPORT_CAP,type HrOfferCsvRow} from "@/modules/placements/hr-offer-export-model";
const offer:HrOfferCsvRow={id:"offer-1",name:"  =HYPERLINK(1,2)",
 role:"+SUM(1,2)",status:"ISSUED",annualCtcInr:700000,issuedAt:new Date("2026-10-15T10:00:00Z"),
 expiresAt:null,joiningDate:null,joiningStatus:null};
describe("HR offer CSV safety",()=>{
 it("neutralizes formulas and never includes candidate contact",()=>{
  const csv=buildHrOfferCsv([offer],1).csv;
  expect(csv).toContain("'  =HYPERLINK");
  expect(csv).toContain("'+SUM");
  expect(csv).toContain("Masked");
  expect(csv).not.toContain("example@test");
 });
 it("caps rows to the published export maximum",()=>{
  const x=buildHrOfferCsv(Array.from({length:HR_OFFER_EXPORT_CAP+1},(_,i)=>({...offer,id:"id-"+i})),
   HR_OFFER_EXPORT_CAP+1);
  expect(x.exported).toBe(HR_OFFER_EXPORT_CAP);
  expect(x.omitted).toBe(1);
 });
});
