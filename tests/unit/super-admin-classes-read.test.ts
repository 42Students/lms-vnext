import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin class directory navigation",()=>{
 it("rejects invalid statuses and large page numbers",()=>{
  expect(readAdminQuery({status:"OTHER"}).success).toBe(false);
  expect(readAdminQuery({page:"1001"}).success).toBe(false);
 });
 it("encodes scoped search with status",()=>{
  expect(superAdminReadHref("/admin/classes",{q:"A+B",status:"ARCHIVED",page:2}))
   .toBe("/admin/classes?q=A%2BB&status=ARCHIVED&page=2");
 });
});
