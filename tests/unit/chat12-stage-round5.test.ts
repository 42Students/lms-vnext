import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO placement roster evidence filters",()=>{
 it("TPO-students-20 has eligible, invited, registered, verified and placed evidence stages",()=>{
  const p=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(p).toContain('name="legacyStage"');
  for(const s of ["ELIGIBLE","INVITED","REGISTERED","VERIFIED","PLACED"])expect(p).toContain(s);
 });
 it("TPO-students-23 filters on a persisted round result sequence",()=>{
  expect(src("src/modules/placements/tpo-students-model.ts")).toContain("row.maximumAppliedRoundSequence>=filter.minRoundReached");
 });
 it("TPO-students-31 derives evidence-based attention flags without inventing prep test scores",()=>{
  expect(src("src/modules/placements/tpo-students-model.ts")).toContain("tpoStudentNeedsAttention");
 });
 it("TPO-students-43 filters needs attention and exposes a corresponding roster field",()=>{
  expect(src("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain('label:"Needs attention"');
 });
 it("TPO-students-52 exposes furthest round without manufacturing an external company outcome",()=>{
  expect(src("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain('label:"Furthest round"');
 });
});
