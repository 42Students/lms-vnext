import {describe,expect,it} from "vitest";
import {legacySidebarItemActive} from "@/components/shell/legacy-sidebar-active-model";
import {collegeAdminItems,superAdminItems} from "@/components/shell/shell-model";
import {collegeLegacyGroupForPath} from "@/modules/people/college-legacy-tabs-model";
import {superAdminLegacyGroupForPath,superAdminLegacyTabActive} from
 "@/modules/people/super-admin-legacy-tabs-model";
const selected=(url:string,items:typeof collegeAdminItems)=>{
 const collegeGroup=collegeLegacyGroupForPath(url)?.title??null;
 const superGroup=superAdminLegacyGroupForPath(url)?.title??null;
 return items.filter(item=>legacySidebarItemActive(url,item,superGroup,collegeGroup))
  .map(item=>item.label);
};
describe("secondary College Admin utility route active ownership",()=>{
 it("keeps linked utility pages under their visible sidebar owners",()=>{
  const expected=[
   ["/college/announcements","Dashboard"],["/college/domains","Profile"],
   ["/college/college-profile","Profile"],["/college/branding","Profile"],
   ["/college/contacts","People"],
  ];
  for(const [url,label] of expected)
   expect(selected(url,collegeAdminItems),url).toEqual([label]);
 });
 it("keeps the existing Super Admin HR alias under Recruiter accounts",()=>{
  expect(superAdminLegacyGroupForPath("/admin/hr")?.title).toBe("Placements");
  expect(superAdminLegacyTabActive("/admin/hr","/admin/recruiters")).toBe(true);
  expect(selected("/admin/hr",superAdminItems)).toEqual(["Placements"]);
 });
});
