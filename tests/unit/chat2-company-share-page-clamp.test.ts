import {describe,it,expect} from "vitest";
import {clampCompanySharePage} from "../../src/modules/placements/company-share/public-filter-model";

describe("public company shortlist pagination",()=>{
 it("keeps valid pages and uses the actual shortlist denominator",()=>{
  expect(clampCompanySharePage(2,51)).toEqual({page:2,totalPages:3});
 });
 it("clamps old links after the shortlist shrinks",()=>{
  expect(clampCompanySharePage(10000,26)).toEqual({page:2,totalPages:2});
 });
 it("returns an honest first empty page",()=>{
  expect(clampCompanySharePage(500,0)).toEqual({page:1,totalPages:1});
 });
});
