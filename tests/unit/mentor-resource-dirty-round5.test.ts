import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const code=()=>readFileSync(join(process.cwd(),"src/components/projects/project-resource-controls.tsx"),"utf8");
describe("mentor editor draft safety",()=>{
 it("MEN-projects-meetings-75 keeps dirty project resource drafts on close or unload",()=>{
  const ui=code();
  expect(ui).toContain("beforeunload");
  expect(ui).toContain("requestClose()");
  expect(ui).toContain("requestEditClose()");
  expect(ui).toContain("Discard this resource?");
  expect(ui).toContain("Discard resource changes?");
  expect(ui).toContain("You have unsaved project changes.");
 });
});
