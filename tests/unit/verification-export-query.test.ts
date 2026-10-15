import {describe,expect,it} from "vitest";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("college verification export query",()=>{
 it("rejects duplicate page, tab and scope fields before any database work",()=>{
  for(const q of ["tab=WAITING&tab=VERIFIED","page=1&page=2","collegeId=foreign"]){
   expect(()=>parseVerificationExportQuery(new URLSearchParams(q))).toThrow();
  }
 });
 it("preserves allowed attention, page size and sort filters",()=>{
  expect(parseVerificationExportQuery(new URLSearchParams("attention=WAITING_OVER_WEEK&pageSize=50&sort=NEWEST"))).toMatchObject({
   attention:"WAITING_OVER_WEEK",pageSize:50,sort:"NEWEST"
  });
 });
});
