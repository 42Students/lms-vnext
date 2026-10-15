import {describe,expect,it} from "vitest";
import {missingSelectedChoice} from "@/modules/verification/filter-options-model";
describe("staff verification filter options",()=>{
 it("preserves selected deep links beyond the bounded roster",()=>{
  const rows=[{id:"one",label:"2025 batch"}];
  expect(missingSelectedChoice(rows,"one")).toBe(false);
  expect(missingSelectedChoice(rows,"two")).toBe(true);
  expect(missingSelectedChoice(rows,"")).toBe(false);
 });
});
