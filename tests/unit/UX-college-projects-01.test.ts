import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const route=readFileSync("src/app/(authenticated)/college/projects/page.tsx","utf8");
const controls=readFileSync("src/components/projects/project-admin-collection-controls.tsx","utf8");
const workspace=readFileSync("src/components/projects/project-admin-workspace-list.tsx","utf8");
describe("/college/projects UX",()=>{
 it("UX-college-projects-01 keeps reachable scoped tools and active filters",()=>{
  expect(route).toContain("<ProjectAdminNav");
  expect(route).toContain("<ProjectAdminFilters");
  expect(route).toContain("getProjectAdminCollegeId(context)");
  expect(controls).toContain('role="search"');
  expect(controls).toContain('aria-label="Clear search"');
 });
 it("UX-college-projects-02 preserves the workspace view switch and authorized archive actions",()=>{
  expect(route).toContain('const viewHref = (targetView: "table" | "cards")');
  expect(route).toContain("<ProjectAdminWorkspaceList");
  expect(workspace).toContain("<ProjectArchiveControl");
  expect(workspace).toContain("aria-label={");
 });
});
