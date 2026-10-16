import {describe,expect,it} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {
 SUPER_ADMIN_LEGACY_GROUPS,superAdminLegacyGroupForPath,
 superAdminLegacyTabActive,
} from "@/modules/people/super-admin-legacy-tabs-model";
import {legacySidebarItemActive} from "@/components/shell/legacy-sidebar-active-model";
import {superAdminItems} from "@/components/shell/shell-model";
describe("Super Admin 13-row sidebar grouped page reachability",()=>{
 const root=join(process.cwd(),"src/app/(authenticated)");
 it("every grouped tab is a real vNext Super Admin page with unique active state",()=>{
  expect(SUPER_ADMIN_LEGACY_GROUPS.map(group=>group.title)).toEqual([
   "Tenant Setup","Academic Setup","Courses & Content","People","Placements","Projects",
  ]);
  for(const group of SUPER_ADMIN_LEGACY_GROUPS){
   for(const tab of group.tabs){
    expect(existsSync(join(root,tab.href.slice(1),"page.tsx")),tab.href).toBe(true);
    expect(superAdminLegacyGroupForPath(tab.href)?.title,tab.href).toBe(group.title);
    expect(group.tabs.filter(t=>superAdminLegacyTabActive(tab.href,t.href)).map(t=>t.label)).toEqual([tab.label]);
   }
  }
 });
 it("retains non-legacy destinations under their canonical grouped owners",()=>{
  const secondary=[
   ["/admin/domains","Tenant Setup","Tenant Setup"],
   ["/admin/academics","Academic Setup","Departments"],
   ["/admin/placements/interviews","Placements","Interviews"],
   ["/admin/placements/interviews/abc","Placements","Interviews"],
  ];
  for(const [path,group,tab] of secondary){
   expect(superAdminLegacyGroupForPath(path)?.title).toBe(group);
   expect(SUPER_ADMIN_LEGACY_GROUPS.find(g=>g.title===group)!.tabs.filter(
     t=>superAdminLegacyTabActive(path,t.href)).map(t=>t.label)).toEqual([tab]);
  }
 });
 it("sidebar covers 13 exact rows and three separator boundaries",()=>{
  expect(superAdminItems.length).toBe(13);
  expect(superAdminItems.flatMap((row,index)=>index>0&&row.group!==superAdminItems[index-1]!.group?[index]:[]))
   .toEqual([3,7,10]);
  for(const row of superAdminItems)
   expect(existsSync(join(root,row.href.slice(1),"page.tsx")),row.href).toBe(true);
  const row=(label:string)=>superAdminItems.find(r=>r.label===label)!;
  expect(legacySidebarItemActive("/admin/features/x",row("Module Access"),null,null)).toBe(true);
  expect(legacySidebarItemActive("/admin/features/x",row("Feature Controls"),null,null)).toBe(false);
 });
});
