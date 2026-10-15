import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {COLLEGE_LEGACY_GROUPS,collegeLegacyGroupForPath} from
 "@/modules/people/college-legacy-tabs-model";
import {collegeAdminItems} from "@/components/shell/shell-model";
describe("College Admin legacy grouped sidebar highlight",()=>{
 it("maps every academic/content/people/placements/projects tab to its sidebar owner",()=>{
  for(const group of COLLEGE_LEGACY_GROUPS){
   const item=collegeAdminItems.find(i=>i.label===group.title);
   expect(item,group.title).toBeTruthy();
   for(const tab of group.tabs)
    expect(collegeLegacyGroupForPath(tab.href)?.title,tab.href).toBe(item!.label);
  }
 });
 it("the shared sidebar renders the active owner of nested College routes",()=>{
  const text=readFileSync(join(process.cwd(),"src/components/shell/sidebar-nav.tsx"),"utf8");
  expect(text).toContain("collegeLegacyGroupForPath(pathname)");
  expect(text).toContain("collegeGroup.title===item.label");
  expect(collegeLegacyGroupForPath("/college/semesters/term")?.title).toBe("Academic Setup");
  expect(collegeLegacyGroupForPath("/college/hiring-dashboard")?.title).toBe("Placements");
  expect(collegeLegacyGroupForPath("/college/projects/at-risk")?.title).toBe("Projects");
  expect(collegeLegacyGroupForPath("/college/groups")?.title).toBe("People");
 });
});
