import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin Screening queue query",()=>{
 it("only parses a single validated status/page",()=>{
  expect(readAdminQuery({status:"HOLD"}).success).toBe(true);
  expect(readAdminQuery({status:"REJECTED"}).success).toBe(true);
  expect(readAdminQuery({status:["HOLD","PENDING"]}).success).toBe(false);
  expect(readAdminQuery({page:"-1"}).success).toBe(false);
 });
 it("maintains review status filters in page links",()=>{
  expect(superAdminReadHref("/admin/placements/screenings",{q:"Candidate A",status:"HOLD",page:2}))
  .toBe("/admin/placements/screenings?q=Candidate+A&status=HOLD&page=2");
 });
});
