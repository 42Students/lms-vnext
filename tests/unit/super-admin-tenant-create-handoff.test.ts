import {describe,expect,it} from "vitest";
import {tenantCreationScopeRequest} from "@/modules/colleges/admin-tenant-create-handoff";
const id="0b53ab32-dca7-4d83-b706-b178c0747ae0";
describe("Super Admin college onboarding handoff",()=>{
 it("uses only the created server college ID",()=>expect(tenantCreationScopeRequest({college:{id,name:"Campus"}})).toEqual({kind:"college",collegeId:id}));
 it("does not switch scope from malformed or missing create responses",()=>{
  expect(tenantCreationScopeRequest({college:{id:"not-a-uuid"}})).toBeNull();
  expect(tenantCreationScopeRequest({id})).toBeNull();
  expect(tenantCreationScopeRequest(null)).toBeNull();
 });
});
