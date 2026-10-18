import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {assertModuleMetricsCollegeScopes} from "@/modules/module-access/admin-overview-metrics-scope";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const college="11111111-1111-4111-8111-111111111111";
const org="22222222-2222-4222-8222-222222222222";
const root:RequestContext={user:{
 id:"33333333-3333-4333-8333-333333333333",
 identityUid:"root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"],
},membership:null,adminScope:{organizationId:org,collegeId:null}};

describe("SA-tenants-modules-R01 persisted role and selected tenant authorization",()=>{
 it("enforces selected organization, current system role and active tenant",()=>{
  const visible=[{id:college,organizationId:org,status:"ACTIVE"}];
  expect(()=>assertModuleMetricsCollegeScopes(root,[college],visible)).not.toThrow();
  const disabled:RequestContext={...root,user:{...root.user,platformStatus:"DISABLED"}};
  const revoked:RequestContext={...root,user:{...root.user,systemRoles:[]}};
  expect(()=>assertModuleMetricsCollegeScopes(disabled,[college],visible)).toThrow(AuthorizationError);
  expect(()=>assertModuleMetricsCollegeScopes(revoked,[college],visible)).toThrow(AuthorizationError);
  expect(()=>assertModuleMetricsCollegeScopes(root,[college],[{...visible[0],organizationId:college}]))
   .toThrow(AuthorizationError);
  expect(()=>assertModuleMetricsCollegeScopes(root,[college],[{...visible[0],status:"ARCHIVED"}]))
   .toThrow(AuthorizationError);
 });
 it("checks persisted authority within the read transaction even for an empty page",()=>{
  const service=readFileSync("src/modules/module-access/admin-overview-metrics-service.ts","utf8");
  const snapshot=service.indexOf('requirePermission(context,"admin-scope.select")');
  const transaction=service.indexOf("getDb().transaction(async tx=>");
  const persisted=service.indexOf('assertPersistedPlatformPermission(tx,context,"admin-scope.select")');
  const empty=service.indexOf("if(!ids.length)return");
  const tenantRead=service.indexOf("const visible=await tx.select");
  const scope=service.indexOf("assertModuleMetricsCollegeScopes(context,ids,visible)");
  const aggregate=service.indexOf("const [learners,overrides]=await Promise.all([");
  const result=service.indexOf("studentOverrides:overrides[0]?.total??0");
  expect(snapshot).toBeGreaterThan(0);
  expect(transaction).toBeGreaterThan(snapshot);
  expect(persisted).toBeGreaterThan(transaction);
  expect(empty).toBeGreaterThan(persisted);
  expect(tenantRead).toBeGreaterThan(empty);
  expect(scope).toBeGreaterThan(tenantRead);
  expect(aggregate).toBeGreaterThan(scope);
  expect(result).toBeGreaterThan(aggregate);
  expect(service).not.toContain("db.select(");
  expect(service).toContain("tx.select({total:countDistinct(moduleAccessRules.id)})");
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
 });
});
