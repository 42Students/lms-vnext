import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref,superAdminReadPages} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin term course mapping filters",()=>{
 it("enforces single-valued validated search/status/page fields",()=>{
  expect(readAdminQuery({status:["ACTIVE","INACTIVE"]}).success).toBe(false);
  expect(readAdminQuery({page:"0"}).success).toBe(false);
  expect(superAdminReadPages(51)).toBe(3);
 });
 it("preserves selected term status and search through pagination",()=>{
  expect(superAdminReadHref("/admin/semester-courses",{q:"CS-101",status:"ACTIVE",page:2}))
   .toBe("/admin/semester-courses?q=CS-101&status=ACTIVE&page=2");
 });
});
