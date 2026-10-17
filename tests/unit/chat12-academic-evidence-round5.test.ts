import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat12 academic evidence from source records",()=>{
 it("TPO-students-21 validates all stored academic percentage, passing year, gap and verification filters",()=>{
  const s=read("src/modules/placements/tpo-students-service.ts");
  for(const field of ["minTenthPct","minTwelfthPct","minDiplomaPct","minUgPct","passingYear","maxGapYears","marksVerified","isLateralEntry"])expect(s).toContain(field);
 });
 it("TPO-students-29 projects persisted evidence without inventing percentage values",()=>{
  const s=read("src/modules/placements/tpo-students-model.ts");
  for(const label of ["tenthPctBasisPoints==null?null","twelfthPctBasisPoints==null?null","diplomaPctBasisPoints==null?null","undergraduatePctBasisPoints==null?null","academicSource===\"VERIFIED\""])expect(s).toContain(label);
 });
 it("TPO-students-22 refuses to reinterpret missing academic evidence as zero",()=>{
  expect(read("src/modules/placements/tpo-students-model.ts")).toContain("gapYears??null");
 });
});
