import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-24 preserves accessible per-column sorting and URL-backed student filter scope",()=>{
 const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
 const model=src("src/components/tpo/tpo-students-spreadsheet.tsx");
 expect(grid).toContain('aria-label={"Sort "+col.label}');
 expect(grid).toContain("aria-sort={sort?.key===col.key");
 expect(model).toContain('const query=new URLSearchParams(params.toString())');
 for(const key of ['urlKey:"journeyState"','urlKey:"profileStatus"','urlKey:"debarred"','urlKey:"afterCollege"'])
  expect(model).toContain(key);
});