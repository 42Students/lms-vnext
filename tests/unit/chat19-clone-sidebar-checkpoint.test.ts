import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

/** Source-only checks for B3/B4. These never imply completed visual verification. */
const read=(path:string)=>readFileSync(path,"utf8");
const legacy=()=>read("docs/design/old-lms-shell.css");
const sidebar=()=>read("src/components/shell/sidebar-legacy.css");

describe("chat-19 B3/B4 legacy shell source-value checks",()=>{
 it("retains the measured collapsed and expanded rail widths",()=>{
  expect(legacy()).toContain("width: 6rem; min-width: 6rem;");
  expect(sidebar()).toContain("width:96px;");
  expect(sidebar()).toContain("min-width:96px;");
  expect(sidebar()).toContain("width:256px;");
 });
});
