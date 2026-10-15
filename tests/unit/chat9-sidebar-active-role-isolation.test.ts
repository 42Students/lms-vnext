import {describe,expect,it} from "vitest";
import {legacySidebarItemActive as active} from "@/components/shell/legacy-sidebar-active-model";
import {collegeLegacyGroupForPath} from "@/modules/people/college-legacy-tabs-model";
import {superAdminLegacyGroupForPath} from "@/modules/people/super-admin-legacy-tabs-model";
import {collegeAdminItems,superAdminItems} from "@/components/shell/shell-model";
const isActive=(path:string,label:string,href:string)=>{
 const sg=superAdminLegacyGroupForPath(path)?.title??null;
 const cg=collegeLegacyGroupForPath(path)?.title??null;
 return active(path,{label,href},sg,cg);
};
describe("legacy active sidebar row owns one grouped College/Admin path",()=>{
 it("never highlights College Dashboard on nested College Admin tabs",()=>{
  for(const path of ["/college/faculty","/college/people","/college/semesters",
    "/college/companies","/college/hiring-dashboard","/college/projects/123/team"]){
   const hits=collegeAdminItems.filter(x=>isActive(path,x.label,x.href));
   expect(hits.map(x=>x.label),path).toEqual([{
    "/college/faculty":"People","/college/people":"People",
    "/college/semesters":"Academic Setup","/college/companies":"Placements",
    "/college/hiring-dashboard":"Placements","/college/projects/123/team":"Projects",
   }[path]]);
  }
  expect(collegeAdminItems.filter(x=>isActive("/college",x.label,x.href))
   .map(x=>x.label)).toEqual(["Dashboard"]);
 });
 it("cannot cross-highlight identically named rows from the other role",()=>{
  expect(isActive("/admin/projects/123/team","Projects","/college/projects")).toBe(false);
  expect(isActive("/college/projects/123/team","Projects","/admin/projects/templates")).toBe(false);
  expect(isActive("/admin/departments","Academic Setup","/college/departments")).toBe(false);
  expect(isActive("/college/departments","Academic Setup","/admin/departments")).toBe(false);
  expect(isActive("/tracker/audit-findings","Activity Log","/college/activity")).toBe(false);
  expect(isActive("/tracker/audit-findings","Activity Log","/admin/audit")).toBe(true);
 });
 it("keeps Super Admin feature detail assigned to Module Access alone",()=>{
  const hits=superAdminItems.filter(x=>isActive("/admin/features/college-id",x.label,x.href));
  expect(hits.map(x=>x.label)).toEqual(["Module Access"]);
 });
});
