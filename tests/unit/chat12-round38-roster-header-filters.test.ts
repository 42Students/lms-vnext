import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-24 supports per-column live header filters sharing URLs and counts with Filter students drawer",()=>{
 const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
 const model=src("src/components/tpo/tpo-students-spreadsheet.tsx");
 expect(grid).toContain('aria-label={"Filter "+col.label}');
 expect(grid).toContain("updateTpoGridQuery(new URLSearchParams(params.toString())");
 for(const key of ['urlKey:"journeyState"','urlKey:"profileStatus"','urlKey:"debarred"','urlKey:"afterCollege"'])
  expect(model).toContain(key);
});