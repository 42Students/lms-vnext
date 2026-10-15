import {describe,expect,it} from "vitest";
import {createdOrganizationStepHref,preferredNewTenantOrganization} from "@/modules/colleges/admin-tenant-organization-step";
const id="8d934e76-5f93-4b20-bc2f-794e9f1171c6";
describe("Super Admin onboarding organization selection",()=>{
 it("advances to a freshly created organization only from a valid response",()=>{
  expect(createdOrganizationStepHref({organization:{id,name:"College Group"}})).toContain(id);
  expect(createdOrganizationStepHref({organization:{id:"invalid"}})).toBeNull();
 });
 it("never selects a guessed, repeated or out-of-scope organization",()=>{
  expect(preferredNewTenantOrganization(id,[{id}])).toBe(id);
  expect(preferredNewTenantOrganization(id,[])).toBeNull();
  expect(preferredNewTenantOrganization([id,id],[{id}])).toBeNull();
 });
});
