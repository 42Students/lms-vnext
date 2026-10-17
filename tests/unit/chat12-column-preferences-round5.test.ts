import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("students column preferences",()=>{
 it("TPO-students-39 restores visible column order without reading window during server rendering",()=>{
  const grid=s("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(grid).toContain("useEffect(()=>");
  expect(grid).toContain("window.localStorage.getItem(storageKey)");
  expect(grid).toContain("window.localStorage.setItem(storageKey,keys.join");
  expect(grid).toContain('params.has("columns")');
  expect(s("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain('storageKey="tpo-students-columns-v1"');
 });
});
