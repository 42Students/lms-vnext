import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadPages,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin Hiring dashboard query",()=>{
 it("permits draft/published/closed search but rejects repeated status",()=>{
  expect(readAdminQuery({status:"CLOSED"}).success).toBe(true);
  expect(readAdminQuery({status:["CLOSED","PUBLISHED"]}).success).toBe(false);
 });
 it("paginates bounded persisted-job metrics",()=>{
  expect(superAdminReadPages(50)).toBe(2);
  expect(superAdminReadHref("/admin/placements/hiring",{q:"Acme",status:"PUBLISHED",page:2}))
  .toBe("/admin/placements/hiring?q=Acme&status=PUBLISHED&page=2");
 });
});
