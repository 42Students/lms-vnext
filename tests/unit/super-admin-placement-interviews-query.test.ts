import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref,superAdminReadPages} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin Interviews read query",()=>{
 it("accepts round statuses and rejects repeated/malformed input",()=>{
  expect(readAdminQuery({status:"SCHEDULED",page:"1"}).success).toBe(true);
  expect(readAdminQuery({status:["SCHEDULED","PENDING"]}).success).toBe(false);
  expect(readAdminQuery({page:"0"}).success).toBe(false);
 });
 it("preserves filters and bounded page count",()=>{
  expect(superAdminReadPages(26)).toBe(2);
  expect(superAdminReadHref("/admin/placements/interviews",{q:"tech round",status:"SCHEDULED",page:2}))
   .toBe("/admin/placements/interviews?q=tech+round&status=SCHEDULED&page=2");
 });
});
