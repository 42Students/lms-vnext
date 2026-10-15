import {describe,it,expect} from "vitest";
import {tpoBatchEmptyReason,tpoBatchClearFiltersHref} from "../../src/modules/placements/tpo-batch-directory-pagination-model";
describe("TPO batch directory empty states",()=>{
 it("distinguishes no cohorts from a filtered-empty view",()=>{
  expect(tpoBatchEmptyReason(0,0)).toBe("NO_BATCHES");
  expect(tpoBatchEmptyReason(30,0)).toBe("NO_MATCH");
  expect(tpoBatchEmptyReason(30,3)).toBeNull();
 });
 it("retains display density while clearing stale filters",()=>{
  const u=new URL(tpoBatchClearFiltersHref(48),"http://localhost");
  expect(u.searchParams.get("pageSize")).toBe("48");
  expect(u.searchParams.get("page")).toBe("1");
  expect(u.searchParams.has("state")).toBe(false);
 });
});
