import {describe,it,expect} from "vitest";
import {verificationSectionEvidenceFiltersValid} from "@/modules/verification/queue-filters";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("Verification evidence requires an Education request",()=>{
 it("rejects contradictory Identity and missing-marksheet facets",()=>{
  expect(verificationSectionEvidenceFiltersValid({kind:"IDENTITY",marksheets:"MISSING",attention:"ALL"})).toBe(false);
  expect(parseCollegeVerificationPageQuery({kind:"IDENTITY",marksheets:"PRESENT"}).success).toBe(false);
  expect(()=>parseVerificationExportQuery(new URLSearchParams("kind=IDENTITY&attention=MISSING_MARKSHEET"))).toThrow();
 });
 it("keeps valid all-kind and Education filters",()=>{
  expect(parseCollegeVerificationPageQuery({kind:"EDUCATION",marksheets:"MISSING"}).success).toBe(true);
  expect(parseCollegeVerificationPageQuery({kind:"IDENTITY"}).success).toBe(true);
 });
});
