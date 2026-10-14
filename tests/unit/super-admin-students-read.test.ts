import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref,superAdminReadPages} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin students directory model",()=>{
 it("guards statuses/pages before any data access",()=>{
  expect(readAdminQuery({status:"UNKNOWN"}).success).toBe(false);
  expect(readAdminQuery({page:["1","2"]}).success).toBe(false);
  expect(superAdminReadPages(25)).toBe(1);
  expect(superAdminReadPages(26)).toBe(2);
 });
 it("preserves search and membership status in pagination",()=>{
  expect(superAdminReadHref("/admin/students",{q:"A&B",status:"ENDED",page:3}))
   .toBe("/admin/students?q=A%26B&status=ENDED&page=3");
 });
});
