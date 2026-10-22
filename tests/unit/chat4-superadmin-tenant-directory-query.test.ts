import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 parseTenantLifecycleSearchParams,tenantLifecycleHref,tenantLifecyclePaging,
 TENANT_LIFECYCLE_PAGE_SIZE,
} from "@/modules/colleges/admin-tenant-lifecycle-model";

const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
describe("Super Admin tenant directory strict URL handling",()=>{
 it("SA-tenants-directory-QUERY-01 rejects repeated and unknown query keys before loading private tenants",()=>{
  expect(parseTenantLifecycleSearchParams({})).toEqual({
   q:"",organizationId:"",status:"ACTIVE",page:1,
  });
  expect(parseTenantLifecycleSearchParams({q:"  Campus  ",page:"3",status:"ARCHIVED",organizationId:org}))
   .toEqual({q:"Campus",page:3,status:"ARCHIVED",organizationId:org});
  for(const malformed of [
   {page:["1","2"]},{page:["1"]},{status:["ACTIVE"]},
   {q:["untrusted"]},{page:"0"},{page:"1.2"},{page:"Infinity"},
   {page:"1001"},{status:"INVALID"},{organizationId:"external"},
   {unknownScope:"college"},{q:"X".repeat(101)},
  ])expect(parseTenantLifecycleSearchParams(malformed)).toBeNull();
 });
 it("SA-tenants-directory-QUERY-02 URL serialization and 20-row paging retain selected authorized filters",()=>{
  expect(TENANT_LIFECYCLE_PAGE_SIZE).toBe(25);
  expect(tenantLifecycleHref({q:"IIT Dharwad",status:"ARCHIVED",organizationId:org,page:2}))
   .toBe("/admin/tenants?q=IIT+Dharwad&organizationId="+org+"&status=ARCHIVED&page=2");
  expect(tenantLifecycleHref({})).toBe("/admin/tenants");
  expect(tenantLifecyclePaging(99,2)).toEqual({total:99,totalPages:4,page:2,offset:25});
  expect(tenantLifecyclePaging(0,18)).toEqual({total:0,totalPages:1,page:1,offset:0});
 });
 it("SA-tenants-directory-QUERY-03 malformed input renders a recovery page without a tenant query",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/tenants/directory/page.tsx","utf8");
  const body=page.slice(page.indexOf("export default async function TenantDirectory("));
  const parse=body.indexOf("parseTenantLifecycleSearchParams(raw)");
  const guard=body.indexOf('if(!parsed) return');
  const query=body.indexOf("getSuperAdminTenantLifecycleDirectory(context,parsed)");
  expect(parse).toBeGreaterThan(-1);
  expect(guard).toBeGreaterThan(parse);
  expect(query).toBeGreaterThan(guard);
  expect(body).toContain('title="Invalid tenant filters"');
  expect(body).toContain('href="/admin/tenants/directory"');
  expect(body).toContain('can(context,"admin-scope.select")');
 });
});