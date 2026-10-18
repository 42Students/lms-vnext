import {describe,expect,it} from "vitest";
import {hrApplicantPageBounds,hrOfferPageBounds,HR_APPLICANT_PAGE_SIZE,HR_OFFER_PAGE_SIZE}
 from "@/modules/placements/hr-job-applicants-model";
describe("HR-PAGINATION-90 recruiter applicant and offer count boundaries",()=>{
 it("keeps exact first, final and out-of-range applicant pages",()=>{
  expect(hrApplicantPageBounds(1,26)).toEqual({
   page:1,pageSize:HR_APPLICANT_PAGE_SIZE,pages:2,first:1,last:25,
  });
  expect(hrApplicantPageBounds(2,26)).toMatchObject({pages:2,first:26,last:26});
  expect(hrApplicantPageBounds(3,26)).toMatchObject({pages:2,first:0,last:0});
 });
 it("reports an empty state accurately without manufacturing a first record",()=>{
  expect(hrApplicantPageBounds(1,0)).toMatchObject({pages:0,first:0,last:0});
  expect(hrOfferPageBounds(1,0)).toMatchObject({total:0,pages:0,first:0,last:0});
 });
 it("does not display NaN, Infinity, negative totals or fractional pages",()=>{
  for(const total of [Number.NaN,Infinity,-Infinity,-4,2.5]){
   expect(hrApplicantPageBounds(1,total)).toMatchObject({pages:0,first:0,last:0});
   expect(hrOfferPageBounds(1,total)).toMatchObject({total:0,pages:0,first:0,last:0});
  }
  for(const page of [Number.NaN,Infinity,-1,0,1.5]){
   expect(hrApplicantPageBounds(page,42)).toMatchObject({page:1,first:1,last:25});
   expect(hrOfferPageBounds(page,22)).toMatchObject({page:1,first:1,last:15});
  }
 });
 it("offers follow independent 15-record page boundaries",()=>{
  expect(hrOfferPageBounds(2,16)).toEqual({
   page:2,pageSize:HR_OFFER_PAGE_SIZE,total:16,pages:2,first:16,last:16,
  });
  expect(hrOfferPageBounds(3,16)).toMatchObject({first:0,last:0,pages:2});
 });
});