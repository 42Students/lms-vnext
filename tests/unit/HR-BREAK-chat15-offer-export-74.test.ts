import {describe,expect,it} from "vitest";
import {buildHrOfferCsv,HR_OFFER_EXPORT_CAP,type HrOfferCsvRow}
 from "@/modules/placements/hr-offer-export-model";

const offer:HrOfferCsvRow={
 id:"o-1",name:"Candidate",role:"Engineer",status:"ISSUED",
 annualCtcInr:900000,joiningDate:"2099-06-01",
 issuedAt:new Date("2099-05-01T18:30:00Z"),expiresAt:null,joiningStatus:null,
};
describe("HR-OFFER-EXPORT-74: safe employer CSV with corrupt historical records",()=>{
 it("reports a corrupted issuance date as unavailable without crashing or forging a date",()=>{
  const csv=buildHrOfferCsv([{...offer,issuedAt:new Date(Number.NaN)}],1).csv;
  expect(csv).not.toContain("Invalid Date");
  expect(csv).not.toContain("NaN");
  expect(csv).toContain('"",""');
  expect(csv).toContain('"Masked"');
 });
 it("ignores corrupt optional expiry timestamps without breaking a complete export",()=>{
  const result=buildHrOfferCsv([{...offer,expiresAt:new Date(Number.NaN)}],1);
  expect(result.exported).toBe(1);
  expect(result.csv).toContain("01/05/2099");
  expect(result.csv).not.toContain("Invalid Date");
 });
 it("never computes nonsensical omitted counts from nonfinite or negative totals",()=>{
  for(const total of [Number.NaN,Infinity,-1,1.5]){
   const result=buildHrOfferCsv([offer],total);
   expect(result.omitted).toBe(0);
   expect(result.csv).not.toContain("Export capped");
  }
 });
 it("caps at the documented maximum without exposing contact columns",()=>{
  const rows=Array.from({length:HR_OFFER_EXPORT_CAP+3},(_,i)=>({
   ...offer,id:"o-"+i,name:i===0?"=HYPERLINK(1,2)":"Candidate "+i,
  }));
  const result=buildHrOfferCsv(rows,rows.length);
  expect(result.exported).toBe(HR_OFFER_EXPORT_CAP);
  expect(result.omitted).toBe(3);
  expect(result.csv).toContain("'=HYPERLINK");
  expect(result.csv).toContain("3 additional authorized offers");
  expect(result.csv).not.toContain("contact@example.test");
 });
});