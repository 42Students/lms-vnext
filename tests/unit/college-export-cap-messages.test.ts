import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {ACADEMIC_EXPORT_CAP} from "@/modules/academics/college-academic-export-model";
import {ELECTIVES_EXPORT_CAP} from "@/modules/academics/college-elective-export-model";
describe("College Admin export cap disclosures",()=>{
 it("Electives export UI discloses the same bounded cap as the exporter",()=>{
  const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/electives/page.tsx"),"utf8");
  expect(ELECTIVES_EXPORT_CAP).toBe(1000);
  expect(source).toContain("Exports up to {ELECTIVES_EXPORT_CAP} matching");
  expect(source).toContain("CSV records when results are truncated");
  expect(source).toContain("download href={");
 });
 it("Semesters export UI discloses the same bounded cap as the exporter",()=>{
  const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/semesters/page.tsx"),"utf8");
  expect(ACADEMIC_EXPORT_CAP).toBe(1000);
  expect(source).toContain("Exports up to {ACADEMIC_EXPORT_CAP} matching");
  expect(source).toContain("CSV records when results are truncated");
  expect(source).toContain("download href={");
 });
 it("Batches export UI discloses the same bounded cap as the exporter",()=>{
  const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/batches/page.tsx"),"utf8");
  expect(ACADEMIC_EXPORT_CAP).toBe(1000);
  expect(source).toContain("Exports up to {ACADEMIC_EXPORT_CAP} matching");
  expect(source).toContain("CSV records when results are truncated");
  expect(source).toContain("download href={");
 });
});
