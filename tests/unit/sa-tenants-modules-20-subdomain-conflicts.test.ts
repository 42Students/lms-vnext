import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("SA-tenants-modules-20 conflict and success feedback",()=>{
 it("maps stale/missing allotment to HTTP 409 and wildcard-unready to 503",()=>{
  const route=readFileSync(new URL("../../src/app/api/admin/colleges/[collegeId]/subdomain/route.ts",import.meta.url),"utf8");
  expect(route).toContain('error.code==="MANAGED_WILDCARD_NOT_READY"?503:409');
  expect(route).toContain("instanceof ManagedSubdomainError");
 });
 it("preserves legacy live-address feedback",()=>{
  const ui=readFileSync(new URL("../../src/components/admin/managed-college-subdomain.tsx",import.meta.url),"utf8");
  expect(ui).toContain('data.host+" is live"');
  expect(ui).toContain("The college web address changed.");
 });
});
