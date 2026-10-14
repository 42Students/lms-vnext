import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin faculty assignment directory URL",()=>{
 it("guards malformed filters, preserving selected pagination",()=>{
  expect(readAdminQuery({page:["1","2"]}).success).toBe(false);
  expect(readAdminQuery({status:"FAKE"}).success).toBe(false);
  expect(superAdminReadHref("/admin/faculty-assignment",{q:"Core",status:"ENDED",page:2}))
   .toBe("/admin/faculty-assignment?q=Core&status=ENDED&page=2");
 });
});
