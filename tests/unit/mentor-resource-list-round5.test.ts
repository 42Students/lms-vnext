import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
describe("mentor resource list parity",()=>{
 it("MEN-projects-meetings-55 searches resources, filters types and visibility with clear filters and stats",()=>{
  const code=source("src/components/projects/project-resource-list.tsx");
  for(const s of ["Search resources","All types","Links","Other","Visible to","Clear filters",
    "Total","Showing","Last updated:","No resources match these filters"])expect(code).toContain(s);
  expect(source("src/components/projects/project-workspace.tsx")).toContain("<ProjectResourceList");
 });
 it("MEN-projects-meetings-57 lists human-facing resource labels, last update, state and safe links",()=>{
  const code=source("src/components/projects/project-resource-list.tsx");
  expect(code).toContain("<StatusBadge");
  expect(code).toContain('"Open link"');
  expect(code).toContain("ProjectResourceOpenLink");
  expect(code).toContain("Last updated:");
  expect(source("src/components/projects/project-resource-open-link.tsx")).toContain("This resource has an invalid address.");
  const opener=source("src/components/projects/project-resource-open-link.tsx");
  expect(opener).toContain("Your browser blocked the new tab.");
  expect(opener).toContain("Allow pop-ups for this site to open resources, or use the safe link below.");
  expect(opener).toContain('rel="noopener noreferrer"');
 });
});
