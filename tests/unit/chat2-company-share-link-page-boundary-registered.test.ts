import {describe,it,expect} from "vitest";
import {clampCompanyShareLinksPage,COMPANY_SHARE_PAGE_SIZE} from "../../src/modules/placements/company-share/link-page-model";
describe("registered company share link history",()=>{
 it("retains valid pages",()=>{
  expect(clampCompanyShareLinksPage(2,COMPANY_SHARE_PAGE_SIZE+1)).toEqual({page:2,totalPages:2});
 });
 it("recovers a stale page after concurrent revocation or expiry",()=>{
  expect(clampCompanyShareLinksPage(99,3)).toEqual({page:1,totalPages:1});
 });
 it("keeps an empty history at first page",()=>{
  expect(clampCompanyShareLinksPage(10,0)).toEqual({page:1,totalPages:1});
 });
});
