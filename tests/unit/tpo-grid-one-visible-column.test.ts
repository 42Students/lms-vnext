import {describe,it,expect} from "vitest";
import {canToggleTpoGridColumn} from "@/modules/placements/tpo-grid-column-selection";
import {TpoGridColumnChooser} from "@/components/tpo/tpo-grid-column-chooser";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
describe("TPO grid visible-column floor",()=>{
 it("allows removal until one display column remains",()=>{
  expect(canToggleTpoGridColumn(["student","branch"],false)).toBe(true);
  expect(canToggleTpoGridColumn(["student"],false)).toBe(false);
  expect(canToggleTpoGridColumn(["student"],true)).toBe(true);
 });
 it("disables the last visible column while leaving export-only fields absent",()=>{
  const html=renderToStaticMarkup(createElement(TpoGridColumnChooser,{columns:[{key:"student",label:"Student"},{key:"private",label:"Sensitive",exportOnly:true}],selected:["student"],onChange:()=>{}}));
  expect(html).toContain('disabled=""');
  expect(html).toContain("Student");
  expect(html).not.toContain("Sensitive");
 });
});
