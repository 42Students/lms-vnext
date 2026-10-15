import {describe,expect,it} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {SUPER_ADMIN_LEGACY_GROUPS,superAdminLegacyGroupForPath,superAdminLegacyTabActive} from "@/modules/people/super-admin-legacy-tabs-model";
describe("Super Admin Placements six legacy tabs",()=>{
 it("has exact legacy labels in order and genuine Super Admin pages",()=>{
  const tabs=SUPER_ADMIN_LEGACY_GROUPS.find(x=>x.title==="Placements")!.tabs;
  expect(tabs.map(t=>t.label)).toEqual([
   "Drives","Companies","Interviews","Analytics","Recruiter accounts","Announcements",
  ]);
  for(const tab of tabs)
   expect(existsSync(join(process.cwd(),"src/app/(authenticated)",tab.href.slice(1),"page.tsx")),tab.href).toBe(true);
 });
 it("does not highlight Drives along with Interviews or Analytics",()=>{
  for(const path of ["/admin/placements/calendar","/admin/placements/hiring"]){
    const group=superAdminLegacyGroupForPath(path)!;
    expect(group.title).toBe("Placements");
    expect(group.tabs.filter(t=>superAdminLegacyTabActive(path,t.href)).length).toBe(1);
    expect(superAdminLegacyTabActive(path,"/admin/placements")).toBe(false);
  }
 });
});
