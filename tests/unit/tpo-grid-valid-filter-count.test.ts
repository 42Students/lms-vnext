import {describe,it,expect} from "vitest";
import {activeTpoGridFilterCount} from "@/modules/placements/tpo-grid-filter-state";
describe("TPO grid filter count excludes invalid stale selections",()=>{
 const fields=[{key:"stage",urlKey:"stage",allValue:"ALL",options:[{value:"HOLD",label:"Hold"}]},{key:"channel",urlKey:"channel",allValue:"ALL",options:[{value:"EXTERNAL",label:"External"}]}];
 it("counts only allowed nondefault facets",()=>{expect(activeTpoGridFilterCount(new URLSearchParams("stage=BOGUS&channel=EXTERNAL"),fields)).toBe(1);});
 it("does not misrepresent an unknown saved filter as active",()=>{expect(activeTpoGridFilterCount(new URLSearchParams("stage=BOGUS"),fields)).toBe(0);});
 it("continues to ignore default filters",()=>{expect(activeTpoGridFilterCount(new URLSearchParams("stage=ALL&channel=ALL"),fields)).toBe(0);});
});
