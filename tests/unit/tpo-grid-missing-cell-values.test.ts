import {describe,it,expect} from "vitest";
import {displayTpoGridCell} from "@/modules/placements/tpo-grid-model";
describe("TPO spreadsheet missing-value display",()=>{
 it("distinguishes zero and false-looking numbers from absent values",()=>{expect(displayTpoGridCell(0)).toBe(0);expect(displayTpoGridCell("0")).toBe("0");});
 it("renders missing nullable and whitespace-only cells as unavailable",()=>{expect(displayTpoGridCell(null)).toBe("—");expect(displayTpoGridCell(undefined)).toBe("—");expect(displayTpoGridCell("  ")).toBe("—");});
 it("does not truncate user data in populated cells",()=>{expect(displayTpoGridCell("A long learner name")).toBe("A long learner name");});
});
