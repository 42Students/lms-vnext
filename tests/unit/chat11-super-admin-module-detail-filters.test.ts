import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {adminModuleDetailQuerySchema,parseAdminModuleDetailPageParams}
 from "@/modules/module-access/admin-module-detail-query";

describe("SA-tenants-modules-MOD-FILTER-04 college module override URL scope",()=>{
 it("accepts the canonical supported status and two independent page filters",()=>{
  expect(parseAdminModuleDetailPageParams({})).toMatchObject({page:1,academicPage:1});
  expect(parseAdminModuleDetailPageParams({
   page:"2",academicPage:"3",module:"placements",scope:"COHORT",
   locks:"LOCKED",storedState:"OFF",
  })).toMatchObject({page:2,academicPage:3,module:"placements",scope:"COHORT",
   locks:"LOCKED",storedState:"OFF"});
  expect(adminModuleDetailQuerySchema.safeParse({module:"projects",page:4}).success).toBe(true);
 });
 it("rejects repeat parameters, cross-tenant IDs, noncanonical numbers and unsupported hierarchy",()=>{
  for(const raw of [
   {page:["1","2"]},{academicPage:["1","2"]},{module:["projects"]},
   {collegeId:"other"},{userId:"foreign"},{organizationId:"other"},
   {module:"billing"},{scope:"GLOBAL"},
   {page:"0x10"},{page:"1e2"},{page:" 1"},{page:"01"},{page:"10001"},
   {academicPage:"01"},{academicPage:"1e2"},{academicPage:"0"},{academicPage:"10001"},
   {scopeId:"11111111-1111-4111-8111-111111111111"},
   {scope:"COHORT",scopeId:"other"},
   {storedState:"SELECTED"},
  ])expect(parseAdminModuleDetailPageParams(raw),JSON.stringify(raw)).toBeNull();
 });
 it("authorizes Super Admin before parsing or accessing tenant rows",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/features/[collegeId]/page.tsx","utf8");
  const service=readFileSync("src/modules/module-access/admin-read-service.ts","utf8");
  const identity=page.indexOf("getCurrentRequestContext()");
  const permission=page.indexOf('requirePermission(context,"admin-scope.select")');
  const tenant=page.indexOf("collegeIdSchema.safeParse(collegeId)");
  const parsed=page.indexOf("parseAdminModuleDetailPageParams(await searchParams)");
  const response=page.indexOf("if (!parsed)");
  const read=page.indexOf("await getSuperAdminCollegeModuleAccess(context,collegeId,filters)");
  expect(identity).toBeGreaterThan(0);
  expect(permission).toBeGreaterThan(identity);
  expect(tenant).toBeGreaterThan(permission);
  expect(parsed).toBeGreaterThan(tenant);
  expect(response).toBeGreaterThan(parsed);
  expect(read).toBeGreaterThan(response);
  expect(page).toContain("Invalid module access filters");
  expect(page).toContain("Clear filters");
  expect(page).not.toContain("value[0]");
  expect(service).not.toContain("z.coerce");
  expect(service).toContain("adminModuleDetailQuerySchema.parse(");
 });
});
