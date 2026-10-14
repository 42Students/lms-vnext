import {describe,expect,it} from "vitest";
import {readAdminQuery,superAdminReadHref,superAdminReadPages} from "@/modules/admin-ui/super-admin-read-directory-model";
describe("Super Admin applications directory filters",()=>{
 it("rejects malformed queries, no silent array selection",()=>{
  expect(readAdminQuery({status:["SUBMITTED","WITHDRAWN"]}).success).toBe(false);
  expect(readAdminQuery({page:"0"}).success).toBe(false);
  expect(superAdminReadPages(0)).toBe(1);
 });
 it("preserves search/status through navigation",()=>{
  expect(superAdminReadHref("/admin/placements/applications",{q:"Intern & job",status:"WITHDRAWN",page:2}))
   .toBe("/admin/placements/applications?q=Intern+%26+job&status=WITHDRAWN&page=2");
 });
});
