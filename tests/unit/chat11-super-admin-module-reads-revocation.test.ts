import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={user:{
 id:"33333333-3333-4333-8333-333333333333",identityUid:"admin",
 platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"],
},membership:null,adminScope:{collegeId,organizationId}};
describe("SA-tenants-modules-MOD-READ-05 inherited module directory and detail revalidation",()=>{
 it("central authority denies deactivated roles and selected-scope IDOR",()=>{
  expect(()=>requirePermission(actor,"college.read",{collegeId,organizationId})).not.toThrow();
  expect(()=>requirePermission({...actor,user:{...actor.user,systemRoles:[]}},
   "college.read",{collegeId,organizationId})).toThrow(AuthorizationError);
  expect(()=>requirePermission({...actor,user:{...actor.user,platformStatus:"DISABLED"}},
   "college.read",{collegeId,organizationId})).toThrow(AuthorizationError);
  expect(()=>requirePermission(actor,"college.read",{collegeId:organizationId,organizationId}))
   .toThrow(AuthorizationError);
 });
 it("rebuilds persisted roles and checks every listed college after querying ancestor rules",()=>{
  const source=readFileSync("src/modules/module-access/admin-read-service.ts","utf8");
  const list=source.slice(source.indexOf("export async function listSuperAdminFeatureControls("),
   source.indexOf("export type StoredModuleOverride"));
  const load=list.indexOf("await loadCollegeAncestorRules(collegeRows)");
  const tx=list.indexOf("await db.transaction(async tx=>",load);
  const live=list.indexOf('assertPersistedPlatformPermission(tx,context,"admin-scope.select")',tx);
  const each=list.indexOf("for(const college of collegeRows)",live);
  const guard=list.indexOf('requirePermission(persisted,"college.read"',each);
  const result=list.indexOf("return {",guard);
  expect(load).toBeGreaterThan(0);
  expect(tx).toBeGreaterThan(load);
  expect(live).toBeGreaterThan(tx);
  expect(each).toBeGreaterThan(live);
  expect(guard).toBeGreaterThan(each);
  expect(result).toBeGreaterThan(guard);
 });
 it("checks persisted selected college scope after descendant rule aggregation and before returning",()=>{
  const source=readFileSync("src/modules/module-access/admin-read-service.ts","utf8");
  const detail=source.slice(source.indexOf("export async function getSuperAdminCollegeModuleAccess("));
  const total=detail.indexOf("const total = Number(");
  const transaction=detail.indexOf("await db.transaction(async tx=>",total);
  const persisted=detail.indexOf('assertPersistedPlatformPermission(tx,context,"admin-scope.select")',transaction);
  const guard=detail.indexOf('requirePermission(persisted,"college.read"',persisted);
  const result=detail.indexOf("return {",guard);
  expect(total).toBeGreaterThan(0);
  expect(transaction).toBeGreaterThan(total);
  expect(persisted).toBeGreaterThan(transaction);
  expect(guard).toBeGreaterThan(persisted);
  expect(result).toBeGreaterThan(guard);
  expect(detail.slice(guard,result)).toContain("collegeId:college.id,organizationId:college.organizationId");
 });
});
