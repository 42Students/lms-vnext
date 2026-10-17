import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Students best so far detail",()=>{
 it("TPO-students-28 lists up to 20 named company results in furthest-first tooltip instead of a generic round",()=>{
  const model=read("src/modules/placements/tpo-students-model.ts");
  const sheet=read("src/components/tpo/tpo-students-spreadsheet.tsx");
  const grid=read("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(model).toContain("bestDriveResults:[...source.applications]");
  expect(model).toContain(".slice(0,20).map(application=>{");
  expect(sheet).toContain('tooltip:row=>row.bestDriveResults?.join("\\n")');
  expect(grid).toContain("title={col.tooltip?.(row)}");
 });
});
