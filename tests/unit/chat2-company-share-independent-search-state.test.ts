import {describe,it,expect} from "vitest";
import {companySharePreviewSearchState} from "../../src/modules/placements/company-share/link-page-model";
describe("TPO applicant search and company link history",()=>{
 it("retains link status and link page independently",()=>{
  expect(companySharePreviewSearchState("REVOKED",3)).toEqual({shareStatus:"REVOKED",sharePage:"3"});
 });
 it("omits default values rather than changing applicant filters",()=>{
  expect(companySharePreviewSearchState("ALL",1)).toEqual({});
  expect(companySharePreviewSearchState("ACTIVE",1)).toEqual({shareStatus:"ACTIVE"});
 });
});
