import {describe,it,expect} from "vitest";
import {countVisibleTpoColumns} from "@/modules/placements/tpo-grid-column-selection";
describe("TPO visible-column status only counts real onscreen fields",()=>{
 it("ignores export-only and forged preferences",()=>{expect(countVisibleTpoColumns(["student","branch"],["student","email","bogus"])).toBe(1);});
 it("does not double count duplicate preferences",()=>{expect(countVisibleTpoColumns(["student","branch"],["student","student"])).toBe(1);});
 it("counts all available default preferences",()=>{expect(countVisibleTpoColumns(["student","branch"],["student","branch"])).toBe(2);});
});
