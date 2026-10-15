import {describe,it,expect} from "vitest";
import {paginateCompanyReport} from "../../src/modules/placements/tpo-company-report-view-model";
import type {PlacementReportCompanyRow} from "../../src/modules/placements/report-model";
const row=(name:string,n:number):PlacementReportCompanyRow=>({
 companyId:name,companyName:name,drives:1,applicants:n,applications:n,
 offers:0,acceptedOffers:0,placed:0,averagePackageInr:null,highestPackageInr:null,
});
describe("TPO company report submitted applications",()=>{
 it("sorts real submitted application counts descending with name tie-breaks",()=>{
  const result=paginateCompanyReport([row("Z",2),row("C",9),row("A",9)],{sort:"APPLICATIONS_DESC"});
  expect(result.rows.map(x=>x.companyName)).toEqual(["A","C","Z"]);
 });
});
