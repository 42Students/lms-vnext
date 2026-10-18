import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 adminFeatureQuerySchema,parseAdminFeaturePageParams,boundedAdminFeaturePage,
} from "@/modules/module-access/admin-feature-query";

describe("SA-tenants-modules-MOD-02 safe Module Access URL filters",()=>{
 it("supports normal decimal page strings and numeric internal paging while retaining filters",()=>{
  expect(parseAdminFeaturePageParams({})).toMatchObject({page:1,q:""});
  const result=parseAdminFeaturePageParams({q:" Projects ",page:"002",sort:"CODE"});
  expect(result).toMatchObject({page:2,q:"Projects",sort:"CODE"});
  expect(adminFeatureQuerySchema.parse({page:5}).page).toBe(5);
  expect(boundedAdminFeaturePage(1000,43,20)).toBe(3);
  expect(boundedAdminFeaturePage(1,0,20)).toBe(1);
 });
 it("rejects duplicate parameters, unknown scope overrides, invalid module and nondecimal pages",()=>{
  for(const hostile of [
   {page:["1","2"]},{q:["a","b"]},{collegeId:"other-college"},
   {organizationId:"different"},{page:"1e2"},{page:"0x10"},
   {page:"-1"},{page:" 2 "},{page:"+2"},{page:"2.0"},
   {page:"0"},{page:"10001"},{module:"billing"},
   {q:"x".repeat(101)},
  ]){
   expect(parseAdminFeaturePageParams(hostile),JSON.stringify(hostile)).toBeNull();
  }
 });
 it("refuses incompatible no-rule and stored state filters",()=>{
  for(const params of [
   {presence:"NO_RULE",storedState:"ON"},
   {presence:"NO_RULE",locks:"LOCKED"},
   {presence:"NO_RULE",recent:"7D"},
  ]){
   expect(parseAdminFeaturePageParams(params)).toBeNull();
  }
 });
 it("requires Super Admin before parsing or listing filters",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/module-access/page.tsx","utf8");
  const auth=page.indexOf('requirePermission(context,"admin-scope.select")');
  const parse=page.indexOf("parseAdminFeaturePageParams(await searchParams)");
  const list=page.indexOf("listSuperAdminFeatureControls(context,parsed)");
  expect(auth).toBeGreaterThan(0);
  expect(parse).toBeGreaterThan(auth);
  expect(list).toBeGreaterThan(parse);
  expect(page).toContain('title="Invalid feature filters"');
 });
});
