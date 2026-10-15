import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
describe("TPO grid All-filter semantics",()=>{
 it("preserves column choice when clearing a canonical stage filter",()=>{
  const before=new URLSearchParams("page=2&columns=student,role&stage=REJECTED");
  const result=updateTpoGridQuery(before,{stage:""});
  expect(result.get("columns")).toBe("student,role");
  expect(result.has("stage")).toBe(false);
  expect(result.has("page")).toBe(false);
 });
 it("supports canonical application All choices and URL keys",()=>{
  const grid=readFileSync("src/components/tpo/tpo-grid-filter-panel.tsx","utf8");
  const apps=readFileSync("src/components/tpo/tpo-applications-spreadsheet.tsx","utf8");
  expect(grid).toContain("field.allValue");
  for(const field of ["stage","channel","eligibility"])expect(apps).toContain('urlKey:"'+field+'",allValue:"ALL"');
 });
});
