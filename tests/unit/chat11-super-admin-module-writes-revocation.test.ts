import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const admin:RequestContext={user:{
 id:"33333333-3333-4333-8333-333333333333",identityUid:"root",
 platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"],
},membership:null,adminScope:{organizationId,collegeId}};
describe("SA-tenants-modules-MOD-WRITE-06 module rule revocation matrix",()=>{
 it("denies removed Super Admin, disabled accounts and foreign college identities",()=>{
  const scope={organizationId,collegeId};
  expect(can(admin,"college.manage",scope)).toBe(true);
  expect(can({...admin,user:{...admin.user,systemRoles:[]}},"college.manage",scope)).toBe(false);
  expect(can({...admin,user:{...admin.user,platformStatus:"DISABLED"}},"college.manage",scope)).toBe(false);
  expect(can(admin,"college.manage",{organizationId,collegeId:organizationId})).toBe(false);
 });
 it.each([
  ["college","src/modules/module-access/admin-college-rule-write.ts",
    'assertPersistedPlatformPermission(tx,context,"college.manage"',".for(\"update\")"],
  ["academic descendants","src/modules/module-access/admin-descendant-rule-write.ts",
    'assertPersistedPlatformPermission(tx,ctx,"college.manage"',".for(\"update\")"],
 ] as const)("requires persisted authority in %s transaction before CAS/no-op/write/audit",(_label,path,needle,lockText)=>{
  const source=readFileSync(path,"utf8");
  const transaction=source.indexOf("getDb().transaction(async tx=>");
  const lock=source.indexOf(lockText,transaction);
  const persisted=source.indexOf(needle,lock);
  const stale=source.indexOf("STALE_RULE",persisted);
  const change=source.indexOf("tx.insert(moduleAccessRules)",persisted);
  const audit=source.indexOf("tx.insert(activityEvents)",persisted);
  expect(transaction).toBeGreaterThan(0);
  expect(lock).toBeGreaterThan(transaction);
  expect(persisted).toBeGreaterThan(lock);
  expect(stale).toBeGreaterThan(persisted);
  expect(change).toBeGreaterThan(stale);
  expect(audit).toBeGreaterThan(change);
  expect(source.slice(persisted,stale)).toContain("collegeId:college.id,organizationId:college.organizationId");
 });
});
