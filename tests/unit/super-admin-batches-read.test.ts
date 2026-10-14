import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin Batch directory model",()=>{
 it("rejects malformed pagination without silently choosing array input",()=>{
  expect(readAdminQuery({page:["1","2"]}).success).toBe(false);
  expect(readAdminQuery({page:"0"}).success).toBe(false);
 });
 it("preserves filters safely in navigation",()=>{
  expect(superAdminReadHref("/admin/batches",{q:"Batch A",status:"COMPLETED",page:3}))
   .toBe("/admin/batches?q=Batch+A&status=COMPLETED&page=3");
 });
});
