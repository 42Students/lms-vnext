import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {collegeProjectWorkspaceOwnsTabs} from "@/modules/people/college-legacy-tabs-model";
import {superAdminProjectDetailPath,superAdminLegacyGroupForPath} from "@/modules/people/super-admin-legacy-tabs-model";
describe("College Admin Projects legacy Workspaces and one tab strip",()=>{
 it("shows legacy Projects group and single Workspaces page heading",()=>{
  const page=readFileSync("src/app/(authenticated)/college/projects/page.tsx","utf8");
  const list=readFileSync("src/components/projects/project-admin-workspace-list.tsx","utf8");
  expect(page).toContain('title="Project workspaces"');
  expect(page).not.toContain('eyebrow="College Admin"');
  expect(list).not.toContain("Project execution workspace with team");
  expect(list).toContain("Open workspace");
 });
 it("hides group strip on College/Admin detail routes where section strip owns navigation",()=>{
  const college=readFileSync("src/components/college/college-legacy-group-tabs.tsx","utf8");
  const superadmin=readFileSync("src/components/admin/super-admin-legacy-group-tabs.tsx","utf8");
  const duplicate=readFileSync("src/components/projects/project-admin-nav.tsx","utf8");
  expect(collegeProjectWorkspaceOwnsTabs("/college/projects/11111111-1111-1111-1111-111111111111/summary")).toBe(true);
  expect(collegeProjectWorkspaceOwnsTabs("/college/projects")).toBe(false);
  expect(superAdminProjectDetailPath("/admin/projects/11111111-1111-1111-1111-111111111111/summary")).toBe(true);
  expect(superAdminLegacyGroupForPath("/admin/projects")?.title).toBe("Projects");
  expect(college).toContain("collegeProjectWorkspaceOwnsTabs(pathname)");
  expect(superadmin).toContain("superAdminLegacyGroupForPath(pathname)");
  expect(duplicate).toContain('if (basePath === "/college/projects") return null;');
  expect(duplicate).toContain("Super Admin must keep it here");
 });
});
