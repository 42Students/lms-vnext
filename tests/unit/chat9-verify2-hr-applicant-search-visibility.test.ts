import {describe,expect,it} from "vitest";
import {shouldShowRecruiterApplicantSearch} from "@/modules/placements/hr-applicant-search-visibility";

describe("legacy recruiter applicant search threshold",()=>{
 it("does not add a search box to small authorized applicant sets",()=>{
  expect(shouldShowRecruiterApplicantSearch(0,"")).toBe(false);
  expect(shouldShowRecruiterApplicantSearch(8,"")).toBe(false);
 });
 it("keeps search visible on short later pages when the overall shared count is high",()=>{
  expect(shouldShowRecruiterApplicantSearch(9,"")).toBe(true);
  expect(shouldShowRecruiterApplicantSearch(80,"")).toBe(true);
 });
 it("preserves a way to clear an active query when it matched no records",()=>{
  expect(shouldShowRecruiterApplicantSearch(0,"candidate")).toBe(true);
  expect(shouldShowRecruiterApplicantSearch(1,"  roll  ")).toBe(true);
  expect(shouldShowRecruiterApplicantSearch(2,"  ")).toBe(false);
 });
});
