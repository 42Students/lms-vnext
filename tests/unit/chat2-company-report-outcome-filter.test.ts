import {describe,it,expect} from "vitest";
import {paginateCompanyReport,companyReportViewHref,companyReportViewSchema} from "../../src/modules/placements/tpo-company-report-view-model";
import {tpoCompanyPageCsvHref} from "../../src/modules/placements/tpo-company-page-csv-model";
import type {PlacementReportCompanyRow} from "../../src/modules/placements/report-model";
const row=(name:string,placed:number):PlacementReportCompanyRow=>({
 companyId:name,companyName:name,drives:1,applicants:1,applications:1,
 offers:1,acceptedOffers:placed,placed,averagePackageInr:null,highestPackageInr:null,
});
describe("TPO company report outcomes",()=>{
 const rows=[row("Placed",2),row("Pending",0)];
 it("filters strictly on evidenced current placed learners",()=>{
  expect(paginateCompanyReport(rows,{outcome:"NO_PLACED"}).rows.map(r=>r.companyName)).toEqual(["Pending"]);
  expect(paginateCompanyReport(rows,{outcome:"HAS_PLACED"}).rows.map(r=>r.companyName)).toEqual(["Placed"]);
 });
 it("preserves the same selection in page and CSV navigation",()=>{
  const filters={outcome:"NO_PLACED",q:"Acme",sort:"NAME",page:2};
  expect(companyReportViewHref(filters)).toContain("outcome=NO_PLACED");
  expect(tpoCompanyPageCsvHref(filters)).toContain("outcome=NO_PLACED");
 });
 it("rejects arbitrary status strings",()=>{
  expect(companyReportViewSchema.safeParse({outcome:"INFERRED"}).success).toBe(false);
 });
});
