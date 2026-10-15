import {describe,it,expect} from "vitest";
import {activeTpoGridFilterCount} from "@/modules/placements/tpo-grid-filter-state";
const fields=[{key:"stage",urlKey:"stage",allValue:"ALL"},{key:"branchId"},{key:"journeyState",allValue:""}];
describe("TPO grid filter summary",()=>{
 it("counts only active dimensions and excludes unrelated URL preferences",()=>{
  const q=new URLSearchParams("stage=PLACED&filter.branchId=abc&columns=student,branch&search=A&page=7");
  expect(activeTpoGridFilterCount(q,fields)).toBe(2);
 });
 it("does not count All or empty values, and handles repeat keys as one dimension",()=>{
  expect(activeTpoGridFilterCount(new URLSearchParams("stage=ALL&filter.branchId="),fields)).toBe(0);
  expect(activeTpoGridFilterCount(new URLSearchParams("stage=PLACED&stage=APPLYING"),fields)).toBe(1);
 });
});
