import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {TpoGridColumnChooser} from "@/components/tpo/tpo-grid-column-chooser";
describe("TPO column selection feedback",()=>{
 it("counts permitted display fields, not export-only fields",()=>{
  const html=renderToStaticMarkup(createElement(TpoGridColumnChooser,{columns:[{key:"a",label:"A"},{key:"b",label:"B"},{key:"hidden",label:"Private",exportOnly:true}],selected:["b"],onChange:()=>{}}));
  expect(html).toContain("1 of 2 display columns visible");
  expect(html).not.toContain("Private");
 });
});
