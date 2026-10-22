import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/workspaces/page.tsx"),"utf8");
describe("/college/projects/workspaces UX",()=>{
 it("UX-college-projects-workspaces-01 preserves the canonical workspace route",()=>{
  expect(source).toContain('redirect("/college/projects"+(target.size?"?"+target.toString():""));');
  expect(source).toContain('const allowed=["q","status","page","pageSize","view"] as const;');
 });
 it("UX-college-projects-workspaces-02 forwards only bounded valid legacy filters",()=>{
  expect(source).toContain('typeof value==="string"&&value.length<=120');
  expect(source).toContain('["ALL","ACTIVE","ARCHIVED","COMPLETED","PAUSED"].includes(value)');
  expect(source).toContain('["cards","table"].includes(value)');
 });
});
