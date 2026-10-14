import {describe,it,expect} from "vitest";
import {companyReportViewSchema,paginateCompanyReport,companyReportViewHref} from "@/modules/placements/tpo-company-report-view-model";
const row=(i:number)=>({companyId:String(i),companyName:"Company "+String(i).padStart(3,"0"),drives:1,applicants:0,applications:0,offers:0,acceptedOffers:0,placed:0,averagePackageInr:null,highestPackageInr:null});
describe("TPO by-company report browse",()=>{
 it("filters literally and reaches rows beyond 100",()=>{
  const all=Array.from({length:117},(_,i)=>row(i));
  expect(paginateCompanyReport(all,{q:"",page:5}).rows).toHaveLength(17);
  expect(paginateCompanyReport(all,{q:"",page:99}).page).toBe(5);
  expect(paginateCompanyReport(all,{q:"Company 11",page:1}).total).toBe(7);
  expect(paginateCompanyReport(all,{q:"%",page:1}).total).toBe(0);
 });
 it("sorts numeric metrics descending with unknown CTC last and stable ties",()=>{
  const a=[{...row(1),placed:2,acceptedOffers:3,averagePackageInr:null},
   {...row(2),placed:9,acceptedOffers:1,averagePackageInr:600000},
   {...row(3),placed:1,acceptedOffers:10,averagePackageInr:300000}];
  expect(paginateCompanyReport(a,{q:"",page:1,sort:"PLACED_DESC"}).rows.map(x=>x.companyId)).toEqual(["2","1","3"]);
  expect(paginateCompanyReport(a,{q:"",page:1,sort:"ACCEPTED_DESC"}).rows[0]?.companyId).toBe("3");
  expect(paginateCompanyReport(a,{q:"",page:1,sort:"AVG_CTC_DESC"}).rows.map(x=>x.companyId)).toEqual(["2","3","1"]);
  expect(companyReportViewSchema.safeParse({sort:"HIGHEST_FAKE"}).success).toBe(false);
 });
 it("preserves report season and drive safely on pagination",()=>{
  expect(companyReportViewHref({seasonId:"s",jobId:"j",q:"A & B",page:2})).toBe("/tpo/reports/by-company?seasonId=s&jobId=j&q=A+%26+B&page=2");
  expect(companyReportViewSchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
  expect(companyReportViewSchema.safeParse({page:"-1"}).success).toBe(false);
  expect(companyReportViewSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
 });
});
