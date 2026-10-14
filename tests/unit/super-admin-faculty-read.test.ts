import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin faculty read-first directory",()=>{
 it("rejects duplicate statuses and invalid page, retains precise filters",()=>{
  expect(readAdminQuery({status:["ACTIVE","ENDED"]}).success).toBe(false);
  expect(readAdminQuery({page:"0"}).success).toBe(false);
  expect(superAdminReadHref("/admin/faculty",{q:"Ada & Grace",status:"SUSPENDED",page:2}))
   .toBe("/admin/faculty?q=Ada+%26+Grace&status=SUSPENDED&page=2");
 });
});
