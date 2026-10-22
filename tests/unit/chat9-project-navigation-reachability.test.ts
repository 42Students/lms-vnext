import {describe,expect,it} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {collegeAdminItems} from "@/components/shell/shell-model";
import {COLLEGE_LEGACY_GROUPS,collegeLegacyTabActive} from "@/modules/people/college-legacy-tabs-model";
describe("College Projects navigation has a real route and one tab strip",()=>{
  const root=join(process.cwd(),"src/app/(authenticated)");
  it("resolves every legacy sidebar href to an actual page",()=>{
    expect(collegeAdminItems.map(x=>x.label)).toEqual([
      "Dashboard","Activity Log","Academic Setup","Courses & Content","People",
      "Profile verification","Placements","Placement cell","Projects","Profile",
    ]);
    for(const item of collegeAdminItems) {
      expect(existsSync(join(root,item.href,"page.tsx")),item.href).toBe(true);
    }
  });
  it("links Projects and Workspaces to the real list and preserves detail route",()=>{
    expect(collegeAdminItems.find(x=>x.label==="Projects")?.href).toBe("/college/projects");
    expect(COLLEGE_LEGACY_GROUPS.find(x=>x.title==="Projects")?.tabs[0]?.href).toBe("/college/projects");
    expect(existsSync(join(root,"college/projects/[projectId]/page.tsx"))).toBe(true);
    expect(existsSync(join(root,"college/projects/[projectId]/[section]/page.tsx"))).toBe(true);
    const list=readFileSync(join(root,"college/projects/page.tsx"),"utf8");
    expect(list).toContain('basePath="/college/projects"');
    const nav=readFileSync(join(process.cwd(),"src/components/projects/project-admin-nav.tsx"),"utf8");
    expect(nav).toContain('if (basePath === "/college/projects") return null;');
    expect(nav).toContain("Super Admin must keep it here");
  });
  it("has exactly one active project group tab even on nested paths",()=>{
    const tabs=COLLEGE_LEGACY_GROUPS.find(x=>x.title==="Projects")!.tabs;
    for(const path of ["/college/projects","/college/projects/123/summary",
      "/college/projects/at-risk","/college/projects/readiness",
      "/college/projects/templates/uuid"]){
      expect(tabs.filter(tab=>collegeLegacyTabActive(path,tab.href)).length,path).toBe(1);
    }
  });
});
