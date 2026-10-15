import {describe,expect,it} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
const root=join(process.cwd(),"src/app/(authenticated)/admin/tenants");
describe("Super Admin Tenant Setup dev-legacy stage copy",()=>{
 it("matches the exact title and launch-step heading from TenantsHub.js",()=>{
  const source=readFileSync(join(root,"create/page.tsx"),"utf8");
  expect(source).toContain("Create the customer, then make one college launch-ready");
  expect(source).toContain("Create an organization and its colleges");
  expect(source).toContain("Get this college ready to go live");
  expect(source).toContain("Domains, branding and readiness checks are college-specific");
 });
 it("keeps Create and Set up explicitly reachable without assuming college scope",()=>{
  const hub=readFileSync(join(root,"page.tsx"),"utf8");
  expect(hub).toContain('href="/admin/tenants/create"');
  expect(hub).toContain('href="/admin/tenants/setup"');
  expect(existsSync(join(root,"create/page.tsx"))).toBe(true);
  expect(existsSync(join(root,"setup/page.tsx"))).toBe(true);
  expect(hub).toContain('title="Tenant Setup"');
 });
});
