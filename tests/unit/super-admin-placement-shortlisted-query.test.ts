import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin Shortlisted query",()=>{
 it("rejects duplicated status, invalid page and bad statuses",()=>{
  expect(readAdminQuery({status:["SUBMITTED","WITHDRAWN"]}).success).toBe(false);
  expect(readAdminQuery({page:"-4"}).success).toBe(false);
  expect(readAdminQuery({status:"RECRUITER_NOTE"}).success).toBe(false);
 });
 it("keeps application status selected during paging",()=>{
  expect(superAdminReadHref("/admin/placements/shortlisted",{q:"student",status:"WITHDRAWN",page:2}))
   .toBe("/admin/placements/shortlisted?q=student&status=WITHDRAWN&page=2");
 });
});
