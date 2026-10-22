import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";

describe("learner jobs legacy filter reset",()=>{
 it("clears only filter facets while keeping the saved tab and sort",()=>{
  const source=readFileSync("src/components/placements/learner-jobs-browse.tsx","utf8");
  const reset=source.slice(source.indexOf("const resetFilters=()=>{"),source.indexOf("  return (",source.indexOf("const resetFilters=()=>{")));
  expect(reset).toContain("updateQuery({q:null,type:null,loc:null,eligible:null,soon:null,");
  expect(reset).toContain("availability:null");
  expect(reset).not.toContain("sort:null");
  expect(reset).not.toContain("saved:null");
  expect(reset).not.toContain("tab:null");
  expect(source).toContain('if(prior.get("tab")==="saved")');
 });
});
