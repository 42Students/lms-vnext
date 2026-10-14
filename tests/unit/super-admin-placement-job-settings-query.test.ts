import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref,superAdminReadPages} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin Job Settings read query",()=>{
 it("distinguishes lifecycle status from malformed input",()=>{
  expect(readAdminQuery({status:"PUBLISHED"}).success).toBe(true);
  expect(readAdminQuery({status:["PUBLISHED","ARCHIVED"]}).success).toBe(false);
  expect(readAdminQuery({page:"1001"}).success).toBe(false);
 });
 it("supports stable job filter pagination",()=>{
  expect(superAdminReadPages(25)).toBe(1);
  expect(superAdminReadHref("/admin/placements/job-settings",{q:"Engineer",status:"DRAFT",page:2}))
  .toBe("/admin/placements/job-settings?q=Engineer&status=DRAFT&page=2");
 });
});
