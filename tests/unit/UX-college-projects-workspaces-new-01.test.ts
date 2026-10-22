import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const legacyEntry=read("src/app/(authenticated)/college/projects/workspaces/new/page.tsx");
const create=read("src/app/(authenticated)/college/projects/create/page.tsx");
describe("/college/projects/workspaces/new UX",()=>{
 it("UX-college-projects-workspaces-new-01 preserves old bookmarks through the canonical creation route",()=>{
  expect(legacyEntry).toContain('redirect("/college/projects/create?mode=teams")');
  expect(create).toContain("No published Project template is assigned to this college.");
  expect(create).toContain("ProjectAdminNav");
 });
 it("UX-college-projects-workspaces-new-02 preserves accessible create-mode navigation and scoped templates",()=>{
  expect(create).toContain('aria-label="Workspace creation modes"');
  expect(create).toContain('href={"/college/projects/create?mode="+item.key}');
  expect(create).toContain("ClassTeamWorkspaceCreator");
  expect(create).toContain("listAssignedProjectTemplates(context,collegeId)");
 });
});
