import {describe,it,expect} from "vitest";
import {verificationAttentionAgeCompatible} from "@/modules/verification/queue-filters";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("College verification attention intersections",()=>{
 it("rejects mutually exclusive overdue and younger wait windows",()=>{
  for(const ageBand of ["WITHIN_48_HOURS","TWO_TO_SEVEN_DAYS"]){
   const raw={attention:"WAITING_OVER_WEEK",ageBand};
   expect(verificationAttentionAgeCompatible({...raw,waitingState:"ALL"})).toBe(false);
   expect(parseCollegeVerificationPageQuery(raw).success).toBe(false);
   expect(()=>parseVerificationExportQuery(new URLSearchParams(raw))).toThrow();
  }
 });
 it("rejects changed-verified-details with first-submission-only state",()=>{
  expect(parseCollegeVerificationPageQuery({attention:"VERIFIED_DETAILS_CHANGED",waitingState:"SUBMITTED"}).success).toBe(false);
  expect(verificationAttentionAgeCompatible({attention:"VERIFIED_DETAILS_CHANGED",waitingState:"UPDATE_PENDING",ageBand:"ANY"})).toBe(true);
 });
});
