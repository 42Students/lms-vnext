import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 persisted:vi.fn(),select:vi.fn(),transaction:vi.fn(),limits:[] as number[],
 rows:[] as Array<Array<Record<string,unknown>>>,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.persisted,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async (fn:(tx:unknown)=>Promise<unknown>)=>{
   mocks.transaction();
   const tx={select:(...args:unknown[])=>{
    mocks.select(...args);
    return {from(){return this;},innerJoin(){return this;},
     where(){return this;},orderBy(){return this;},
     limit(n:number){mocks.limits.push(n);return Promise.resolve(mocks.rows.shift()??[]);},
    };
   }};
   return fn(tx);
  },
 }),
}));
import { listCollegeStudentImportOptions } from "@/modules/people/college-student-import-options";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const context:RequestContext={
 user:{id:"local-admin",identityUid:"local-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"local-member",collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
beforeEach(()=>{
 mocks.persisted.mockReset();mocks.select.mockReset();mocks.transaction.mockReset();
 mocks.rows.length=0;mocks.limits.length=0;
 mocks.persisted.mockResolvedValue(undefined);
});

describe("COL-student-import-OPTIONS-01 authenticated student import choices",()=>{
 it("denies ordinary learner, disabled user and foreign/inactive membership before database reads",async()=>{
  for(const bad of [
   {...context,membership:{...context.membership!,roles:["LEARNER" as const]}},
   {...context,user:{...context.user,platformStatus:"DISABLED" as const}},
   {...context,membership:{...context.membership!,status:"SUSPENDED" as const}},
  ]){
   await expect(listCollegeStudentImportOptions(bad)).rejects.toBeDefined();
  }
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("rechecks persisted actor under the transaction before any private academic choices",async()=>{
  mocks.persisted.mockRejectedValueOnce(new Error("ROLE_REMOVED"));
  await expect(listCollegeStudentImportOptions(context)).rejects.toThrow("ROLE_REMOVED");
  expect(mocks.transaction).toHaveBeenCalledOnce();
  expect(mocks.persisted).toHaveBeenCalledWith(expect.anything(),context,"academics.manage",{
   collegeId,organizationId,
  });
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("returns exactly its authorized program/cohort/section options with fixed safe caps",async()=>{
  const programs=[{id:"program",name:"Computing"}];
  const batches=[{id:"cohort",programId:"program",name:"First years"}];
  const classes=[{id:"section",cohortId:"cohort",name:"A",capacity:40}];
  mocks.rows.push(programs,batches,classes);
  const result=await listCollegeStudentImportOptions(context);
  expect(result).toEqual({programs,batches,classes});
  expect(mocks.select).toHaveBeenCalledTimes(3);
  expect(mocks.limits).toEqual([500,2000,3000]);
  expect(mocks.persisted).toHaveBeenCalledOnce();
 });
 it("does not invent program or class choices when the scoped database is empty",async()=>{
  const result=await listCollegeStudentImportOptions(context);
  expect(result).toEqual({programs:[],batches:[],classes:[]});
 });
});
