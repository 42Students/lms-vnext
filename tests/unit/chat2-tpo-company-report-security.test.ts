import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {companyReportViewSchema,paginateCompanyReport,companyReportViewHref,companyReportHasUserFilters,COMPANY_REPORT_PAGE_SIZE} from "@/modules/placements/tpo-company-report-view-model";
import {tpoReportHasAmbiguousFilters,tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {tpoVisibleCompanyReportCsv,tpoCompanyPageCsvHref} from "@/modules/placements/tpo-company-page-csv-model";
import {buildTpoCompanyReportLinks} from "@/modules/placements/tpo-company-report-links-model";

const id=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const companies=[
 {companyId:id(1),companyName:"Alpha",drives:1,applicants:2,applications:2,offers:0,acceptedOffers:0,placed:0,averagePackageInr:null,highestPackageInr:null},
 {companyId:id(2),companyName:"Beta",drives:3,applicants:10,applications:12,offers:4,acceptedOffers:2,placed:2,averagePackageInr:600000,highestPackageInr:800000},
 {companyId:id(3),companyName:"Gamma",drives:2,applicants:6,applications:6,offers:2,acceptedOffers:1,placed:1,averagePackageInr:400000,highestPackageInr:400000},
];
describe("UX-tpo-reports-company-01 tenant-safe company report and visible CSV parity",()=>{
 it("rejects repeated CSV filters rather than taking an arbitrary first value",()=>{
  expect(tpoReportHasRepeatedSearchParams(new URLSearchParams("page=1&sort=NAME"))).toBe(false);
  for(const query of [
   "page=1&page=2","seasonId=one&seasonId=two",
   "q=Alpha&q=Beta","jobId=a&jobId=b","unknown=a&unknown=b"
  ])expect(tpoReportHasRepeatedSearchParams(new URLSearchParams(query))).toBe(true);
  expect(tpoReportHasAmbiguousFilters({page:["1","2"]})).toBe(true);
  expect(tpoReportHasAmbiguousFilters({q:"Alpha",page:"1"})).toBe(false);
 });
 it("screen rejects invalid search, sort, outcome and page instead of guessing",()=>{
  expect(companyReportViewSchema.parse({})).toMatchObject({q:"",sort:"NAME",page:1,outcome:"ALL"});
  for(const invalid of [
   {q:"q".repeat(101)},{sort:"DROP TABLE"},
   {page:0},{page:-3},{page:10001},{page:"1.5"},
   {outcome:"SELECTED"},{collegeId:id(9)}
  ])expect(companyReportViewSchema.safeParse(invalid).success).toBe(false);
 });
 it("visible-page projection filters, sorts, clamps bounds and keeps original data intact",()=>{
  expect(COMPANY_REPORT_PAGE_SIZE).toBe(25);
  const displayed=paginateCompanyReport(companies,{sort:"PLACED_DESC"});
  expect(displayed.rows.map(r=>r.companyName)).toEqual(["Beta","Gamma","Alpha"]);
  expect(companies.map(r=>r.companyName)).toEqual(["Alpha","Beta","Gamma"]);
  expect(paginateCompanyReport(companies,{q:"  beta  ",sort:"NAME"}).rows.map(r=>r.companyId)).toEqual([id(2)]);
  expect(paginateCompanyReport(companies,{outcome:"NO_PLACED"}).rows.map(r=>r.companyId)).toEqual([id(1)]);
  expect(paginateCompanyReport(companies,{outcome:"HAS_PLACED",page:999}).page).toBe(1);
  expect(paginateCompanyReport(companies,{sort:"AVG_CTC_DESC"}).rows.at(-1)?.companyId).toBe(id(1));
  expect(companyReportHasUserFilters({q:" ",outcome:"ALL"})).toBe(false);
  expect(companyReportHasUserFilters({q:"",outcome:"HAS_PLACED"})).toBe(true);
 });
 it("navigation and visible CSV use encoded matching scope, filters and page",()=>{
  const view=companyReportViewHref({seasonId:id(5),jobId:id(6),q:"A & B",sort:"PLACED_DESC",outcome:"HAS_PLACED",page:2});
  expect(view).toContain("seasonId="+id(5));
  expect(view).toContain("q=A+%26+B");
  expect(view).toContain("page=2");
  const exportHref=tpoCompanyPageCsvHref({seasonId:id(5),jobId:id(6),q:"A & B",sort:"PLACED_DESC",outcome:"HAS_PLACED",page:2});
  expect(exportHref).toContain("/api/placements/tpo/reports/by-company-page/export?");
  expect(exportHref).toContain("q=A+%26+B");
  expect(exportHref).toContain("page=2");
  expect(exportHref).toContain("outcome=HAS_PLACED");
 });
 it("visible report CSV neutralizes spreadsheet formulas in externally supplied company names",()=>{
  const csv=tpoVisibleCompanyReportCsv([{...companies[0]!,companyName:'=HYPERLINK("https://bad.test")'}]);
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain('""https://bad.test""');
  expect(csv).toContain("Unique applicants");
 });
 it("company links reject forged IDs, deduplicate and stay inside the TPO company workspace",()=>{
  const links=buildTpoCompanyReportLinks([...companies,{...companies[0]!},{...companies[1]!,companyId:"../admin"}]);
  expect(links.total).toBe(3);
  expect(links.rows.map(r=>r.href)).toEqual([1,2,3].map(n=>"/tpo/companies/"+id(n)));
  expect(links.truncated).toBe(false);
 });
 it("visible-page GET verifies role and repeated params before private workspace queries",()=>{
  const s=readFileSync("src/app/api/placements/tpo/reports/by-company-page/export/route.ts","utf8");
  expect(s).toContain("getCurrentRequestContext");
  expect(s).toContain('hasMembershipRole(context,"TPO")');
  expect(s).toContain("tpoReportHasRepeatedSearchParams(params)");
  expect(s.indexOf("tpoReportHasRepeatedSearchParams(params)")).toBeLessThan(s.indexOf("getPlacementReportWorkspace(context"));
  expect(s).toContain("companyReportViewSchema.safeParse");
  expect(s).toContain('collegeId:context.membership.collegeId');
  expect(s).toContain('"Cache-Control":"private, no-store"');
  expect(s).toContain('"X-Content-Type-Options":"nosniff"');
 });
});
