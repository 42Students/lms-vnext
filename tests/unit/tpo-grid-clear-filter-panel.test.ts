import {describe,it,expect} from "vitest";
import {clearTpoGridFilters} from "@/modules/placements/tpo-grid-filter-reset";
describe("TPO grid filter reset",()=>{
 it("keeps column preferences, unrelated search, and removes pagination",()=>{
  const before=new URLSearchParams("stage=HOLD&channel=EXTERNAL&columns=student,role&search=ada&page=5");
  const next=clearTpoGridFilters(before,[{key:"stage",urlKey:"stage"},{key:"channel",urlKey:"channel"}]);
  expect(next.get("columns")).toBe("student,role");
  expect(next.get("search")).toBe("ada");
  expect(next.has("page")).toBe(false);
  expect(next.has("stage")).toBe(false);
  expect(next.has("channel")).toBe(false);
  expect(before.get("stage")).toBe("HOLD");
 });
 it("also clears namespaced grid facets without modifying other query parameters",()=>{
  const next=clearTpoGridFilters(new URLSearchParams("filter.branch=IT&sort=OLDEST"),[{key:"branch"}]);
  expect(next.toString()).toBe("sort=OLDEST");
 });
});
