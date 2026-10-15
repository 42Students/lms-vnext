import {describe,expect,it} from "vitest";
import {describePrimaryDomainSwitch} from "@/modules/tenant-domains/admin-confirmation-model";
describe("Super Admin primary-domain confirmation",()=>{
 it("names the old and new domain for an informed change",()=>{
  const label=describePrimaryDomainSwitch("old.college.edu","new.college.edu");
  expect(label).toContain("old.college.edu");
  expect(label).toContain("new.college.edu");
  expect(label).toContain("redirects");
 });
 it("does not claim DNS changes and distinguishes first primary",()=>{
  expect(describePrimaryDomainSwitch(null,"college.edu")).toContain("not edited");
  expect(describePrimaryDomainSwitch("college.edu","college.edu")).toContain("already primary");
 });
});
