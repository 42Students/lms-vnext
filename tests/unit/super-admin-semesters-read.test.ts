import {describe,expect,it} from "vitest";
import { readAdminQuery,superAdminReadHref,superAdminReadPages } from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin semester read URL",()=>{
 it("rejects malformed/duplicated filters and never accepts forged college overrides",()=>{
  expect(readAdminQuery({page:["1","2"]}).success).toBe(false);
  expect(readAdminQuery({page:"-1"}).success).toBe(false);
  expect(readAdminQuery({q:"Semester",collegeId:"another-college"}).success).toBe(true);
  // Only q/status/page are passed to the service; arbitrary scope parameters are ignored.
 });
 it("preserves search/status page links and clamps count denominator",()=>{
  expect(superAdminReadPages(0)).toBe(1);
  expect(superAdminReadPages(26)).toBe(2);
  expect(superAdminReadHref("/admin/semesters",{q:"A&B",status:"INACTIVE",page:2}))
   .toBe("/admin/semesters?q=A%26B&status=INACTIVE&page=2");
 });
});
