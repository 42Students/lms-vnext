import {describe,expect,it} from "vitest";
import {collegeWorkspaceStatusLabel} from "@/modules/projects/college-workspace-status-label";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("College Admin legacy workspace listing parity",()=>{
 it("COL-projects-08 maps ACTIVE and COMPLETED to legacy words and only claims Blocked with persisted blocker evidence",()=>{
  expect(collegeWorkspaceStatusLabel("ACTIVE")).toBe("In progress");
  expect(collegeWorkspaceStatusLabel("ACTIVE",["Active blocker"])).toBe("Blocked");
  expect(collegeWorkspaceStatusLabel("ACTIVE",["Pending review"])).toBe("In progress");
  expect(collegeWorkspaceStatusLabel("COMPLETED")).toBe("Ready");
  expect(collegeWorkspaceStatusLabel("ARCHIVED")).toBe("Archived");
  expect(collegeWorkspaceStatusLabel("PLANNED")).toBe("Planned");
 });
 it("COL-projects-08 keeps filtered page CSV, 10/20/50/100 choices, template tag and table/list",()=>{
  const page=source("src/app/(authenticated)/college/projects/page.tsx");
  const list=source("src/components/projects/project-admin-workspace-list.tsx");
  const controls=source("src/components/projects/project-admin-collection-controls.tsx");
  const csv=source("src/components/projects/project-admin-workspace-page-export.tsx");
  expect(page).toContain("riskReasons:project.riskReasons");
  expect(page).toContain('view={query.view}');
  expect(list).toContain("No template — attach one");
  expect(list).toContain("collegeWorkspaceStatusLabel(item.status,item.riskReasons)");
  expect(controls).toContain("[10, 20, 25, 50, 100]");
  expect(csv).toContain("collegeWorkspaceStatusLabel(item.status,item.riskReasons)");
  expect(csv).toContain("items.map(");
  expect(csv).toContain("project-workspaces-page.csv");
 });
});
