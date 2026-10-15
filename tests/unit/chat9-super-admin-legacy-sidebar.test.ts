import {describe,expect,it} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {superAdminItems,getShellNavigation} from "@/components/shell/shell-model";
import type {RequestContext} from "@/modules/identity/context";
const expected=[
  ["Overview","/dashboard"],["Tenant Setup","/admin/tenants"],
  ["Feature Controls","/admin/features"],["Module Access","/admin/module-access"],
  ["Tenant Settings","/admin/settings"],["Activity Log","/admin/audit"],
  ["Inbound mail","/admin/inbound-mail"],["Academic Setup","/admin/departments"],
  ["Courses & Content","/admin/courses"],["People","/admin/faculty"],
  ["Profile verification","/admin/verification"],["Placements","/admin/placements"],
  ["Projects","/admin/projects/templates"],
];
const context:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,recruiter:null,
};
describe("exact Super Admin legacy sidebar",()=>{
 it("has exactly 13 labels in the lms-dev-2026 source order",()=>{
  expect(superAdminItems.map(x=>[x.label,x.href])).toEqual(expected);
  expect(getShellNavigation(context).map(x=>[x.label,x.href])).toEqual(expected);
 });
 it("only creates dividers after Feature Controls, Inbound mail and People",()=>{
  const breaks=superAdminItems.flatMap((item,i)=>i>0&&item.group!==superAdminItems[i-1]!.group?[i]:[]);
  expect(breaks).toEqual([3,7,10]);
 });
 it("every sidebar href resolves to a real Next.js page",()=>{
  for(const item of superAdminItems)
   expect(existsSync(join(process.cwd(),"src/app/(authenticated)",item.href.slice(1),"page.tsx")),item.href).toBe(true);
 });
});
