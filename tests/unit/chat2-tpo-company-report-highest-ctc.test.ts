import {describe,it,expect} from "vitest";
import {paginateCompanyReport} from "../../src/modules/placements/tpo-company-report-view-model";
import type {PlacementReportCompanyRow} from "../../src/modules/placements/report-model";
const row=(name:string,ctc:number|null):PlacementReportCompanyRow=>({
 companyId:name,companyName:name,drives:1,applicants:1,applications:1,
 offers:1,acceptedOffers:1,placed:1,averagePackageInr:ctc,highestPackageInr:ctc,
});
describe("TPO actual highest annual accepted CTC ordering",()=>{
 it("orders highest recorded CTC first and unknown amounts last",()=>{
  const result=paginateCompanyReport([row("No data",null),row("Mid",600000),row("High",1200000)],{sort:"HIGHEST_CTC_DESC"});
  expect(result.rows.map(x=>x.companyName)).toEqual(["High","Mid","No data"]);
 });
 it("preserves stable company-name ties",()=>{
  expect(paginateCompanyReport([row("Beta",10),row("Alpha",10)],{sort:"HIGHEST_CTC_DESC"}).rows.map(r=>r.companyName)).toEqual(["Alpha","Beta"]);
 });
});
