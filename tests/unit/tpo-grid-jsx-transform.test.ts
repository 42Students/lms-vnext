import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it,expect} from "vitest";
import {TpoGridColumnChooser} from "@/components/tpo/tpo-grid-column-chooser";
describe("TPO column chooser renders real TSX in Vitest",()=>{
 it("displays the count for permitted columns without export-only leakage",()=>{
  const html=renderToStaticMarkup(createElement(TpoGridColumnChooser,{
   columns:[{key:"student",label:"Student"},{key:"branch",label:"Branch"},{key:"email",label:"Sensitive export",exportOnly:true}],
   selected:["student","email"],onChange:()=>{},
  }));
  expect(html).toContain("1 of 2 display columns visible");
  expect(html).not.toContain("Sensitive export");
 });
});
