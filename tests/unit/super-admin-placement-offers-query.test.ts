import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin offers directory query",()=>{
 it("accepts offer states without accepting malformed page/status arrays",()=>{
  expect(readAdminQuery({status:"ACCEPTED"}).success).toBe(true);
  expect(readAdminQuery({status:["ISSUED","ACCEPTED"]}).success).toBe(false);
  expect(readAdminQuery({page:"0"}).success).toBe(false);
 });
 it("keeps filters in paging",()=>{
  expect(superAdminReadHref("/admin/placements/offers",{q:"Offer & job",status:"ISSUED",page:2}))
   .toBe("/admin/placements/offers?q=Offer+%26+job&status=ISSUED&page=2");
 });
});
