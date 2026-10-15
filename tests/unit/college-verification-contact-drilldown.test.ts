import {describe,expect,it} from "vitest";
import {collegeRoleContactHref} from "@/modules/people/college-role-directory-model";
describe("Staff verification to masked Contacts detail",()=>{
 it("constructs only the exact safe member detail URL",()=>{
  const id="00000000-0000-4000-8000-000000000345";
  expect(collegeRoleContactHref(id)).toBe("/college/contacts/"+id);
  expect(()=>collegeRoleContactHref("../../other-tenant")).toThrow();
 });
});
