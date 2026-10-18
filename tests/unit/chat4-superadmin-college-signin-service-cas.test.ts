import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 lifecycle:vi.fn(),persisted:vi.fn(),ready:vi.fn(),txExecute:vi.fn(),transaction:vi.fn(),
 select:vi.fn(),insert:vi.fn(),update:vi.fn(),values:vi.fn(),set:vi.fn(),
 rows:[] as Array<Array<Record<string,unknown>>>,
 result:[] as Array<Record<string,unknown>>,
}));
vi.mock("@/db/client",()=>({getDb:()=>({
 execute:mocks.ready,transaction:mocks.transaction,
})}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
 getSuperAdminTenantLifecycleDetail:mocks.lifecycle,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.persisted,
}));

import {
 saveAdminCollegeSignInPolicy, readAdminCollegeSignInPolicy, CollegeSignInPolicyError,
} from "@/modules/colleges/admin-signin-policy-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"22222222-2222-4222-8222-222222222222",
  identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,
 adminScope:{collegeId,organizationId},
};
const payload=(method:"EMAIL_ONLY"|"PHONE_ONLY"|"EMAIL_AND_PHONE"|"PHONE_AND_EMAIL",expectedVersion:number)=>({
 collegeId,method,expectedVersion,
});
const active=[{id:collegeId}];
beforeEach(()=>{
 for(const [key,fn] of Object.entries(mocks)){
  if(key!=="rows"&&key!=="result"&&typeof fn==="function")fn.mockReset();
 }
 mocks.rows.length=0;
 mocks.result.length=0;
 mocks.lifecycle.mockResolvedValue({id:collegeId,organizationId,status:"ACTIVE"});
 mocks.persisted.mockResolvedValue(undefined);
 mocks.ready.mockResolvedValue({rows:[{ready:true}]});
 mocks.txExecute.mockResolvedValue({rows:[{found:true}]});
 mocks.values.mockResolvedValue(undefined);
 const selectBuilder={
  from(){return this;},where(){return this;},for(){return this;},
  limit:()=>Promise.resolve(mocks.rows.shift()??[]),
 };
 const updateBuilder={set:(value:unknown)=>{mocks.set(value);return updateBuilder;},
  where(){return this;},
  returning:()=>Promise.resolve(mocks.result),
 };
 mocks.select.mockImplementation(()=>selectBuilder);
 mocks.insert.mockImplementation(()=>({values:(value:unknown)=>mocks.values(value),returning:()=>Promise.resolve(mocks.result)}));
 mocks.update.mockImplementation(()=>updateBuilder);
 const tx={select:mocks.select,update:mocks.update,insert:mocks.insert,execute:mocks.txExecute};
 mocks.transaction.mockImplementation(async(fn:(transaction:typeof tx)=>Promise<unknown>)=>fn(tx));
});

describe("SA-colleges-signin-01 sign-in policy write CAS and actor revocation",()=>{
 it("denies College Admin, disabled SA and a mismatched selected-college before DB writes",async()=>{
  for(const bad of [
   {...actor,user:{...actor.user,systemRoles:[] as const}},
   {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
   {...actor,adminScope:{...actor.adminScope!,collegeId:"33333333-3333-4333-8333-333333333333"}},
  ]){
   await expect(saveAdminCollegeSignInPolicy(bad,payload("PHONE_ONLY",0)))
    .rejects.toBeDefined();
  }
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it("rejects invalid method, unknown fields or fractional CAS before database access",async()=>{
  for(const raw of [
   {...payload("PHONE_ONLY",0),method:"UNKNOWN"},
   {...payload("PHONE_ONLY",0),expectedVersion:1.25},
   {...payload("PHONE_ONLY",0),organizationId:"foreign"},
  ]){
   await expect(saveAdminCollegeSignInPolicy(actor,raw)).rejects.toBeDefined();
  }
  expect(mocks.lifecycle).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("fails without mutating when staged storage is absent",async()=>{
  mocks.ready.mockResolvedValue({rows:[{ready:false}]});
  await expect(saveAdminCollegeSignInPolicy(actor,payload("PHONE_ONLY",0)))
   .rejects.toMatchObject({code:"SIGNIN_STORAGE_PENDING"});
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("reauthorizes against persisted Super Admin state within the write transaction",async()=>{
  mocks.persisted.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(saveAdminCollegeSignInPolicy(actor,payload("PHONE_ONLY",0)))
   .rejects.toThrow("REVOKED");
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
 });
 it("requires an active college before returning a sign-in state",async()=>{
  mocks.rows.push([]);
  await expect(saveAdminCollegeSignInPolicy(actor,payload("PHONE_ONLY",0)))
   .rejects.toMatchObject({code:"COLLEGE_UNAVAILABLE"});
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it("idempotent resend of an already-applied policy does not update or double-audit",async()=>{
  mocks.rows.push(active,[{method:"EMAIL_ONLY",version:7}]);
  const saved=await saveAdminCollegeSignInPolicy(actor,payload("EMAIL_ONLY",6));
  expect(saved).toEqual({method:"EMAIL_ONLY",version:7});
  expect(mocks.persisted).toHaveBeenCalledTimes(1);
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it("CAS rejects a different stale policy without overwriting newer admin changes",async()=>{
  mocks.rows.push(active,[{method:"PHONE_ONLY",version:5}]);
  await expect(saveAdminCollegeSignInPolicy(actor,payload("EMAIL_ONLY",4)))
   .rejects.toMatchObject({code:"SIGNIN_POLICY_STALE"});
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it("updates policy and writes exactly one tenant-scoped activity record on a valid CAS",async()=>{
  mocks.rows.push(active,[{method:"PHONE_ONLY",version:2}]);
  mocks.result.push({method:"EMAIL_ONLY",version:3});
  const saved=await saveAdminCollegeSignInPolicy(actor,payload("EMAIL_ONLY",2));
  expect(saved).toEqual({method:"EMAIL_ONLY",version:3});
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({method:"EMAIL_ONLY",version:3}));
  expect(mocks.insert).toHaveBeenCalledTimes(1);
  expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({
   collegeId,organizationId,actorUserId:actor.user.id,
   eventType:"identity.college_signin.updated",
   subjectId:collegeId,
   metadata:{from:"PHONE_ONLY",to:"EMAIL_ONLY",version:3},
  }));
 });
 it("keeps the typed failure distinct from a successful no-op",()=>{
  expect(new CollegeSignInPolicyError("SIGNIN_POLICY_STALE").code).toBe("SIGNIN_POLICY_STALE");
 });
});

describe("SA-colleges-signin-02 authorized policy reads and unconfigured states",()=>{
 it("returns migration-pending when the table does not exist without querying staged policies",async()=>{
  mocks.txExecute.mockResolvedValue({rows:[{found:false}]});
  const result=await readAdminCollegeSignInPolicy(actor,collegeId);
  expect(result.policy).toEqual({kind:"MIGRATION_PENDING",method:null});
  expect(result.college.id).toBe(collegeId);
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.persisted).toHaveBeenCalledWith(
   expect.anything(),actor,"college.read",{collegeId,organizationId},
  );
 });
 it("distinguishes unconfigured, valid and corrupted stored policies",async()=>{
  for(const [rows,expected] of [
   [[],{kind:"NOT_CONFIGURED",method:null}],
   [[{method:"EMAIL_ONLY",version:3,updatedAt:new Date("2099-01-01T00:00:00Z")}],
    {kind:"CONFIGURED",method:"EMAIL_ONLY"}],
   [[{method:"UNKNOWN",version:3}],{kind:"INVALID_POLICY",method:null}],
  ] as const){
   mocks.rows.push([...rows]);
   const result=await readAdminCollegeSignInPolicy(actor,collegeId);
   expect(result.policy).toEqual(expected);
  }
  expect(mocks.select).toHaveBeenCalledTimes(3);
 });
 it("does not reveal policy after persisted Super Admin role revocation",async()=>{
  mocks.persisted.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(readAdminCollegeSignInPolicy(actor,collegeId)).rejects.toThrow("REVOKED");
  expect(mocks.txExecute).not.toHaveBeenCalled();
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("rejects disabled actors and wrong selected tenant before read transaction",async()=>{
  for(const bad of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
   {...actor,adminScope:{collegeId:"33333333-3333-4333-8333-333333333333",organizationId}},
  ]){
   await expect(readAdminCollegeSignInPolicy(bad,collegeId)).rejects.toBeDefined();
  }
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
});
