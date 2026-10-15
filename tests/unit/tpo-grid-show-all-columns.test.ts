import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {TpoGridColumnChooser} from "@/components/tpo/tpo-grid-column-chooser";
describe("TPO spreadsheet reset visibility control",()=>{
 it("shows a restore action without rendering export-only fields",()=>{
  const html=renderToStaticMarkup(createElement(TpoGridColumnChooser,{columns:[{key:"name",label:"Name"},{key:"branch",label:"Branch"},{key:"secret",label:"Export only",exportOnly:true}],selected:["name"],onChange:()=>{}}));
  expect(html).toContain("Show all columns");
  expect(html).toContain("Branch");
  expect(html).not.toContain("Export only");
 });
});
