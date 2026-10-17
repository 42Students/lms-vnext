import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {chosenTpoGridColumns} from "@/modules/placements/tpo-grid-model";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-12 Students responsive grid and column preference",()=>{
 it("TPO-students-39 honors chosen column order with visible-only columns",()=>{
  const cols=[{key:"a",label:"A",read:()=>1},{key:"b",label:"B",read:()=>2},{key:"c",label:"C",read:()=>3}];
  expect(chosenTpoGridColumns(cols,["c","a"]).map(x=>x.key)).toEqual(["c","a"]);
  expect(chosenTpoGridColumns(cols,[]).map(x=>x.key)).toEqual(["a","b","c"]);
  expect(src("src/components/tpo/tpo-grid-column-chooser.tsx")).toContain("Show all columns");
 });
 it("TPO-students-39 offers keyboard accessible Earlier/Later column controls",()=>{
  const chooser=src("src/components/tpo/tpo-grid-column-chooser.tsx");
  expect(chooser).toContain('aria-label={"Move "+column.label+" earlier"}');
  expect(chooser).toContain('aria-label={"Move "+column.label+" later"}');
  expect(chooser).toContain("onClick={()=>move(-1)}");
 });
 it("TPO-students-51 mobile rows collapse the action picker instead of stacking buttons permanently",()=>{
  const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
  const sheet=src("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(grid).toContain("mobileActionsCollapsible?");
  expect(grid).toContain("<summary");
  expect(sheet).toContain("mobileActionsCollapsible storageKey=");
  expect(sheet).toContain("rows={sortedRows}");
 });
 it("GR-39 uses break-words and min-width guards on narrow screen grid rows",()=>{
  const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(grid).toContain("min-w-0");
  expect(grid).toContain("break-words");
 });
});
