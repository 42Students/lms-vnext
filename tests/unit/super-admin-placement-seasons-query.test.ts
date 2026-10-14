import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref,superAdminReadPages} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin placement seasons URL",()=>{
 it("accepts closed and active, rejects duplicate or invalid status",()=>{
  expect(readAdminQuery({status:"CLOSED"}).success).toBe(true);
  expect(readAdminQuery({status:["ACTIVE","CLOSED"]}).success).toBe(false);
  expect(readAdminQuery({status:"OPEN"}).success).toBe(false);
  expect(superAdminReadPages(0)).toBe(1);
 });
 it("maintains season search pagination",()=>{
  expect(superAdminReadHref("/admin/placements/seasons",{q:"2026 & 27",status:"ACTIVE",page:2}))
  .toBe("/admin/placements/seasons?q=2026+%26+27&status=ACTIVE&page=2");
 });
});
