import {describe,it,expect} from "vitest";
import {clampCompanySharePage} from "../../src/modules/placements/company-share/public-filter-model";
import {tpoShareableShortlistQuerySchema} from "../../src/modules/placements/tpo-shareable-shortlist-model";
describe("TPO share preview pagination contract",()=>{
 const jobId="11111111-1111-4111-8111-111111111111";
 it("bounds a stale preview page to the current last page",()=>{
  const requested=tpoShareableShortlistQuerySchema.parse({jobId,page:900});
  expect(clampCompanySharePage(requested.page,26)).toEqual({page:2,totalPages:2});
 });
 it("returns a genuine first empty page after all records disappear",()=>{
  const requested=tpoShareableShortlistQuerySchema.parse({jobId,page:9});
  expect(clampCompanySharePage(requested.page,0)).toEqual({page:1,totalPages:1});
 });
});
