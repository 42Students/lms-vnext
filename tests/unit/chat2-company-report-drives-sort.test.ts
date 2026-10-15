import {describe,it,expect} from "vitest";
import {paginateCompanyReport,companyReportViewSchema} from "../../src/modules/placements/tpo-company-report-view-model";
import type {PlacementReportCompanyRow} from "../../src/modules/placements/report-model";
const row=(name:string,drives:number):PlacementReportCompanyRow=>({
 companyId:name,companyName:name,drives,applicants:0,applications:0,
 offers:0,acceptedOffers:0,placed:0,averagePackageInr:null,highestPackageInr:null,
});
describe("TPO company report drive count",()=>{
 it("ranks actual drive counts and preserves stable names for ties",()=>{
  const result=paginateCompanyReport([row("Beta",3),row("Zoo",1),row("Alpha",3)],{sort:"DRIVES_DESC"});
  expect(result.rows.map(r=>r.companyName)).toEqual(["Alpha","Beta","Zoo"]);
 });
 it("rejects unknown ordering rather than switching silently",()=>{
  expect(companyReportViewSchema.safeParse({sort:"COMPANY_REVENUE"}).success).toBe(false);
 });
});
