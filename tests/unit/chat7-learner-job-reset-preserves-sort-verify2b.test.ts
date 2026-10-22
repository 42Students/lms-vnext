import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Legacy learner drive filter Reset",()=>{
  it("preserves Saved tab and selected sort while clearing only filter facets",()=>{
    const src=readFileSync("src/components/placements/learner-jobs-browse.tsx","utf8");
    const start=src.indexOf("const resetFilters=()=>");
    const end=src.indexOf("\n  return (",start);
    expect(start).toBeGreaterThan(-1);
    const handler=src.slice(start,end);
    for(const facet of ["q:null","type:null","loc:null","eligible:null","soon:null","availability:null","page:null"])
      expect(handler).toContain(facet);
    expect(handler).not.toContain("sort:null");
    expect(handler).not.toContain("saved:null");
    expect(src).toContain('prior.get("tab")==="saved"');
  });
});
