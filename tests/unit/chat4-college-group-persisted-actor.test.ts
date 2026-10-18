import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import {
 assertPersistedGroupActor, GroupActorAccessError,
} from "@/modules/groups/actor-access";

const mocks=vi.hoisted(()=>({
 select:vi.fn(),lock:vi.fn(),
 rows:[] as Array<Array<Record<string,unknown>>>,
}));
const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const actorId="33333333-3333-4333-8333-333333333333";
const memberId="44444444-4444-4444-8444-444444444444";
const context:RequestContext={
 user:{id:actorId,identityUid:"actor",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:memberId,collegeId:college,
  organizationId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const tx={
 select:(...args:unknown[])=>{
  mocks.select(...args);
  return {
   from(){return this;},
   where(){return this;},
   for:(mode:string)=>{
    mocks.lock(mode);
    return Promise.resolve(mocks.rows.shift()??[]);
   },
  };
 },
} as unknown as Parameters<typeof assertPersistedGroupActor>[0];

beforeEach(()=>{
 mocks.select.mockReset();
 mocks.lock.mockReset();
 mocks.rows.length=0;
});
const rows=(...r:Array<Array<Record<string,unknown>>>)=>mocks.rows.push(...r);

describe("COL-groups-actor-01 persisted authorization for every group write",()=>{
 it("rejects nonexistent or disabled actors before consulting any membership/role",async()=>{
  for(const first of [[],[{status:"DISABLED"}]]){
   rows(first);
   await expect(assertPersistedGroupActor(tx,context,{mode:"MANUAL",collegeId:college}))
    .rejects.toMatchObject({code:"GROUP_ACTOR_INACTIVE"});
  }
  expect(mocks.select).toHaveBeenCalledTimes(2);
  expect(mocks.lock).toHaveBeenCalledTimes(2);
  expect(mocks.lock).toHaveBeenCalledWith("share");
 });
 it("SELF allows only its own active persisted learner membership and role",async()=>{
  rows([{status:"ACTIVE"}],[{userId:actorId,collegeId:college,status:"ACTIVE"}],[{role:"LEARNER"}]);
  await expect(assertPersistedGroupActor(tx,context,{
   mode:"SELF",collegeId:college,memberId,
  })).resolves.toBeUndefined();
  expect(mocks.lock).toHaveBeenCalledTimes(3);
  expect(mocks.lock.mock.calls.every(call=>call[0]==="share")).toBe(true);
 });
 it("SELF refuses mismatched member identity, missing tenant or a different member ID before private reads",async()=>{
  for(const bad of [
   {mode:"SELF" as const,collegeId:college,memberId:other},
   {mode:"SELF" as const,collegeId:null,memberId},
   {mode:"SELF" as const,collegeId:college},
  ]){
   rows([{status:"ACTIVE"}]);
   await expect(assertPersistedGroupActor(tx,context,bad))
    .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
  }
  expect(mocks.select).toHaveBeenCalledTimes(3);
 });
 it("SELF refuses user substitution, cross-tenant membership, suspended membership and revoked learner role",async()=>{
  for(const corrupt of [
   {userId:other,collegeId:college,status:"ACTIVE"},
   {userId:actorId,collegeId:other,status:"ACTIVE"},
   {userId:actorId,collegeId:college,status:"SUSPENDED"},
  ]){
   rows([{status:"ACTIVE"}],[corrupt]);
   await expect(assertPersistedGroupActor(tx,context,{
    mode:"SELF",collegeId:college,memberId,
   })).rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
  }
  rows([{status:"ACTIVE"}],[{userId:actorId,collegeId:college,status:"ACTIVE"}],[]);
  await expect(assertPersistedGroupActor(tx,context,{
   mode:"SELF",collegeId:college,memberId,
  })).rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
 });
 it("MANUAL requires persisted active same-college College Admin membership and role",async()=>{
  rows([{status:"ACTIVE"}],[{userId:actorId,collegeId:college,status:"ACTIVE"}],[{role:"COLLEGE_ADMIN"}]);
  await expect(assertPersistedGroupActor(tx,context,{mode:"MANUAL",collegeId:college}))
   .resolves.toBeUndefined();
  rows([{status:"ACTIVE"}],[{userId:actorId,collegeId:college,status:"ACTIVE"}],[]);
  await expect(assertPersistedGroupActor(tx,context,{mode:"MANUAL",collegeId:college}))
   .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
  expect(mocks.lock).toHaveBeenCalledTimes(6);
 });
 it("MANUAL Super Admin needs a LIVE persisted system role rather than a stale request snapshot",async()=>{
  const superAdmin:RequestContext={
   ...context,user:{...context.user,systemRoles:["SUPER_ADMIN"]},membership:null,
  };
  rows([{status:"ACTIVE"}],[{role:"SUPER_ADMIN"}]);
  await expect(assertPersistedGroupActor(tx,superAdmin,{mode:"MANUAL",collegeId:college}))
   .resolves.toBeUndefined();
  rows([{status:"ACTIVE"}],[]);
  await expect(assertPersistedGroupActor(tx,superAdmin,{mode:"MANUAL",collegeId:college}))
   .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
  expect(mocks.lock).toHaveBeenCalledTimes(4);
 });
 it("preserves typed access errors for safe mapping at the HTTP boundary",()=>{
  const error=new GroupActorAccessError("GROUP_ACTOR_NOT_AUTHORIZED");
  expect(error.name).toBe("GroupActorAccessError");
  expect(error.code).toBe("GROUP_ACTOR_NOT_AUTHORIZED");
 });
});
