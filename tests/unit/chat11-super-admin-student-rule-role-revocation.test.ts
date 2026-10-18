import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {hasPersistedAncestorLock,isStudentRuleNoop,studentRuleMatches,
 studentRuleWriteInput} from "@/modules/module-access/admin-student-rule-model";

const organizationId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const root:RequestContext={user:{
 id:"33333333-3333-4333-8333-333333333333",
 identityUid:"root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"],
},membership:null,adminScope:{collegeId,organizationId}};
describe("SA-tenants-modules-MOD-RACE-03 Super Admin learner module rules",()=>{
 it("rejects revoked user/system roles and wrong active tenant",()=>{
  expect(can(root,"college.manage",{collegeId,organizationId})).toBe(true);
  expect(can({...root,user:{...root.user,systemRoles:[]}},"college.manage",{collegeId,organizationId})).toBe(false);
  expect(can({...root,user:{...root.user,platformStatus:"DISABLED"}},"college.manage",{collegeId,organizationId})).toBe(false);
  expect(can(root,"college.manage",{collegeId:organizationId,organizationId})).toBe(false);
 });
 it("gates all no-ops and writes on fresh active college and persisted role",()=>{
  const source=readFileSync("src/modules/module-access/admin-student-rule-write.ts","utf8");
  const transaction=source.indexOf("getDb().transaction(async tx=>");
  const collegeLock=source.indexOf('where(eq(colleges.id,collegeId)).for("update")',transaction);
  const active=source.indexOf('if(!college||college.status!=="ACTIVE")',collegeLock);
  const persisted=source.indexOf('assertPersistedPlatformPermission(tx,context,"college.manage"',active);
  const memberLock=source.indexOf('.for("update")',persisted);
  const noOp=source.indexOf("isStudentRuleNoop(",memberLock);
  const mutate=source.indexOf("tx.delete(moduleAccessRules)",noOp);
  const audit=source.indexOf("tx.insert(activityEvents)",mutate);
  expect(transaction).toBeGreaterThan(0);
  expect(collegeLock).toBeGreaterThan(transaction);
  expect(active).toBeGreaterThan(collegeLock);
  expect(persisted).toBeGreaterThan(active);
  expect(memberLock).toBeGreaterThan(persisted);
  expect(noOp).toBeGreaterThan(memberLock);
  expect(mutate).toBeGreaterThan(noOp);
  expect(audit).toBeGreaterThan(mutate);
  expect(source.slice(persisted,memberLock)).toContain("collegeId,organizationId:college.organizationId");
 });
 it("rejects forged modules and stale override tokens; ancestor locks still take priority",()=>{
  expect(studentRuleWriteInput.safeParse({
   action:"SET",module:"projects",enabled:true,locked:false,expected:null,
  }).success).toBe(true);
  for(const raw of [
   {action:"SET",module:"placements",enabled:true,locked:false,expected:null},
   {action:"SET",module:"projects",enabled:true,locked:false,expected:null,collegeId},
   {action:"INHERIT",module:"projects",expected:{enabled:true}},
  ])expect(studentRuleWriteInput.safeParse(raw).success).toBe(false);
  expect(studentRuleMatches({enabled:true,locked:true},{enabled:true,locked:false})).toBe(false);
  expect(isStudentRuleNoop({enabled:true,locked:false},{action:"SET",enabled:true,locked:false})).toBe(true);
  expect(isStudentRuleNoop({enabled:true,locked:false},{action:"SET",enabled:false,locked:false})).toBe(false);
  expect(hasPersistedAncestorLock([{locked:false},{locked:true}])).toBe(true);
 });
});
