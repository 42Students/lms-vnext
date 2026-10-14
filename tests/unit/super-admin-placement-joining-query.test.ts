import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin Joining Outcomes query",()=>{
 it("handles lifecycle states, strict statuses and duplicate protection",()=>{
  for(const status of ["PENDING","JOINED","DID_NOT_JOIN","DEFERRED"])
   expect(readAdminQuery({status}).success).toBe(true);
  expect(readAdminQuery({status:["JOINED","PENDING"]}).success).toBe(false);
 });
 it("preserves status during pagination",()=>{
  expect(superAdminReadHref("/admin/placements/joining",{q:"Engineer",status:"DEFERRED",page:2}))
  .toBe("/admin/placements/joining?q=Engineer&status=DEFERRED&page=2");
 });
});
