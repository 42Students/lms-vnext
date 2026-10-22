import {describe,expect,it} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {parseAdminFeaturePageParams} from "@/modules/module-access/admin-feature-query";
describe("Super Admin Module Access entry",()=>{
 const path=join(process.cwd(),"src/app/(authenticated)/admin/module-access/page.tsx");
 it("uses persisted scoped module-access service, not a dummy redirect",()=>{
  const s=readFileSync(path,"utf8");
  expect(s).toContain('requirePermission(context, "admin-scope.select")');
  expect(s).toContain("const collegeId = context.adminScope?.collegeId");
  expect(s).toContain("<SuperAdminCollegeModuleAccessPage params={Promise.resolve({collegeId})}");
  expect(s).toContain("getModuleAccessOverviewMetrics(context, [collegeId])");
  expect(s).toContain('"/admin/features/"+encodeURIComponent(collegeId)');
  expect(s).toContain('title="Module Access"');
  expect(existsSync(join(process.cwd(),"src/app/(authenticated)/admin/features/[collegeId]/page.tsx"))).toBe(true);
 });
 it("refuses repeated or injected company-scope query params",()=>{
  expect(parseAdminFeaturePageParams({q:["a","b"]})).toBeNull();
  expect(parseAdminFeaturePageParams({collegeId:"external"})).toBeNull();
  expect(parseAdminFeaturePageParams({q:"test",page:"2"})?.page).toBe(2);
 });
});
