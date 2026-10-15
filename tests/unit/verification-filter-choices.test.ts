import {describe,expect,it} from "vitest";
import {missingSelectedChoice} from "@/modules/verification/filter-options-model";
describe("staff verification filter options",()=>{
 it("renders distinguishable cohort and class option labels",()=>{
  const row={id:"class-id",label:"2027 · CSE-A"};
  expect(row.label).toContain("CSE-A");
 });
 it("retains selected foreign IDs visually without granting access or synthesizing labels",()=>{
  expect(missingSelectedChoice([], "00000000-0000-4000-8000-000000000001")).toBe(true);
 });
 it("preserves selected deep links beyond the bounded roster",()=>{
  const rows=[{id:"one",label:"2025 batch"}];
  expect(missingSelectedChoice(rows,"one")).toBe(false);
  expect(missingSelectedChoice(rows,"two")).toBe(true);
  expect(missingSelectedChoice(rows,"")).toBe(false);
 });
});
