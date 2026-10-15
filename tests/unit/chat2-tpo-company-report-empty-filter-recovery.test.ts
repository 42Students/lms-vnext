import {describe,it,expect} from "vitest";
import {companyReportHasUserFilters,companyReportViewHref} from "../../src/modules/placements/tpo-company-report-view-model";
describe("TPO by-company filtered empty recovery",()=>{
 it("distinguishes filtered empty from a first-run empty season",()=>{
  expect(companyReportHasUserFilters({q:"",outcome:"ALL"})).toBe(false);
  expect(companyReportHasUserFilters({q:"No match",outcome:"ALL"})).toBe(true);
  expect(companyReportHasUserFilters({q:"",outcome:"NO_PLACED"})).toBe(true);
 });
 it("clears company filters without erasing authorized season scope",()=>{
  const url=new URL(companyReportViewHref({seasonId:"season",jobId:"job"}),"http://localhost");
  expect(url.searchParams.get("seasonId")).toBe("season");
  expect(url.searchParams.get("jobId")).toBe("job");
  expect(url.searchParams.has("q")).toBe(false);
  expect(url.searchParams.has("outcome")).toBe(false);
 });
});
