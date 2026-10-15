import {describe,expect,it} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {SUPER_ADMIN_LEGACY_GROUPS,superAdminLegacyTabActive} from "@/modules/people/super-admin-legacy-tabs-model";
const root=join(process.cwd(),"src/app/(authenticated)");
describe("Super Admin Tenant Setup strip",()=>{
 it("has a scoped directory, Organizations, Colleges, in that order",()=>{
  expect(SUPER_ADMIN_LEGACY_GROUPS[0]?.tabs).toEqual([
   {label:"Tenant Setup",href:"/admin/tenants"},
   {label:"Organizations",href:"/admin/organizations"},
   {label:"Colleges",href:"/admin/colleges"},
  ]);
  for(const tab of SUPER_ADMIN_LEGACY_GROUPS[0]!.tabs)
   expect(existsSync(join(root,tab.href.slice(1),"page.tsx")),tab.href).toBe(true);
 });
 it("preserves tenant detail routing and only selects its parent tab",()=>{
  expect(superAdminLegacyTabActive("/admin/tenants/setup","/admin/tenants")).toBe(true);
  expect(superAdminLegacyTabActive("/admin/colleges/123","/admin/tenants")).toBe(false);
  expect(superAdminLegacyTabActive("/admin/colleges/123","/admin/colleges")).toBe(true);
 });
});
