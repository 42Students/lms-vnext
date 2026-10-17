import {describe,it,expect} from "vitest";
import {filterCompanyEngagement,companyEngagementHref} from "../../src/modules/placements/tpo-company-engagement-filter-model";
describe("TPO report company dimension",()=>{
 it("TPO-calendar-reports-31 filters the company table without leaking unauthorized company rows",()=>{
  const rows=[{companyId:"company-a",leads:2},{companyId:"company-b",leads:1}];
  expect(filterCompanyEngagement(rows,"company-a").rows).toEqual([rows[0]]);
  expect(filterCompanyEngagement(rows,"foreign-company")).toEqual({rows:[],valid:false});
  expect(filterCompanyEngagement(rows,null).rows).toEqual(rows);
 });
 it("TPO-calendar-reports-31 preserves season/drive while switching company",()=>{
  const url=companyEngagementHref({companyId:"company-a",seasonId:"season-a",jobId:"drive-a"});
  expect(url).toContain("companyId=company-a");
  expect(url).toContain("seasonId=season-a");
  expect(url).toContain("jobId=drive-a");
 });
});