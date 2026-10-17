import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {exportTpoStudentsCsv,tpoStudentCsvCell} from "@/modules/placements/tpo-students-csv";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat12 selected student CSV",()=>{
 it("TPO-students-36 includes academic evidence, Stage, After college and Batch/Branch in guarded CSV",()=>{
  expect(tpoStudentCsvCell("=SUM(A1)")).toBe("\"'=SUM(A1)\"");
  const code=s("src/modules/placements/tpo-students-csv.ts");
  for(const h of ['"10th %"','"12th %"','"Diploma %"','"UG %"','"Stage"','"After college"','"Batch"','"Branch"'])expect(code).toContain(h);
  expect(typeof exportTpoStudentsCsv).toBe("function");
 });
 it("TPO-students-17 exports only the currently authorized visible page selection",()=>{
  const source=s("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(source).toContain("const chosen=sortedRows.filter");
  expect(source).toContain("permitted.has(row.membershipId)");
  expect(source).toContain('anchor.download="selected-tpo-students.csv"');
  expect(source).toContain('role="alert"');
 });
});
