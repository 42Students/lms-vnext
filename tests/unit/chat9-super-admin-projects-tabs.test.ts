import {describe,expect,it} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {SUPER_ADMIN_LEGACY_GROUPS,superAdminLegacyGroupForPath,superAdminLegacyTabActive} from "@/modules/people/super-admin-legacy-tabs-model";
describe("Super Admin Projects Templates-first legacy strip",()=>{
 it("uses exactly the six source labels and real list pages",()=>{
  const group=SUPER_ADMIN_LEGACY_GROUPS.find(x=>x.title==="Projects")!;
  expect(group.tabs.map(t=>t.label)).toEqual([
    "Templates","Workspaces","At Risk","Readiness","Submissions","Audit",
  ]);
  for(const tab of group.tabs)
    expect(existsSync(join(process.cwd(),"src/app/(authenticated)",tab.href.slice(1),"page.tsx")),tab.href).toBe(true);
 });
 it("never duplicates the list strip inside workspace/template detail",()=>{
  expect(superAdminLegacyGroupForPath("/admin/projects/123/summary")).toBeNull();
  expect(superAdminLegacyGroupForPath("/admin/projects/templates/123/overview")).toBeNull();
  expect(superAdminLegacyTabActive("/admin/projects/readiness","/admin/projects")).toBe(false);
  expect(superAdminLegacyTabActive("/admin/projects","/admin/projects")).toBe(true);
  const src=readFileSync(join(process.cwd(),"src/components/projects/project-admin-nav.tsx"),"utf8");
  expect(src).toContain('if (basePath === "/college/projects") return null;');
  expect(src).toContain("PROJECT_ADMIN_SECTIONS.map");
  expect(existsSync(join(process.cwd(),"src/app/(authenticated)/admin/projects/[projectId]/page.tsx"))).toBe(true);
 });
});
