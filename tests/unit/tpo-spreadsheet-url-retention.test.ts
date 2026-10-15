import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("TPO grid columns persist across server-authored links",()=>{
 const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
 it("retains columns in Students filter form and page links",()=>{
  const code=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(code).toContain('name="columns"');
  expect(code).toContain("columns:first(raw.columns)");
  expect(code).toContain("filters.columns");
 });
 it("retains bounded columns in Applications form and next/previous links",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx");
  expect(code).toContain('name="columns"');
  expect(code).toContain("...(columns?{columns}:{})");
  expect(code).toContain(".slice(0,800)");
 });
});
