import {describe,expect,it} from "vitest";
import {assertPersistedGroupActor,GroupActorAccessError} from "@/modules/groups/actor-access";
import type {RequestContext} from "@/modules/identity/context";

const collegeA="11111111-1111-4111-8111-111111111111";
const collegeB="22222222-2222-4222-8222-222222222222";
const ctx=():RequestContext=>({
 user:{id:"actor",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:collegeA,organizationId:"org",status:"ACTIVE",roles:["COLLEGE_ADMIN","LEARNER"]},
});

/** Exercising the function's real branching with a deterministic transactional
 * query adapter. This is not a substitute for an actual PostgreSQL row-lock race. */
function fakeTx(batches:Array<Array<Record<string,unknown>>>) {
 const locks:string[]=[];
 const query={
  from(_table:unknown){return this;},
  where(_predicate:unknown){return this;},
  for(mode:string){locks.push(mode);return Promise.resolve(batches.shift()??[]);},
 };
 return {
  tx:{select:(_projection:unknown)=>query} as unknown as Parameters<typeof assertPersistedGroupActor>[0],
  locks,remaining:()=>batches.length,
 };
}
const active={status:"ACTIVE"};
const membership={userId:"actor",collegeId:collegeA,status:"ACTIVE"};

describe("College group mutations - persisted authorization break-it matrix",()=>{
 it("COL-groups-ACTOR-01 accepts a real active College Admin only after user/member/role SHARE locks",async()=>{
  const q=fakeTx([[active],[membership],[{role:"COLLEGE_ADMIN"}]]);
  await expect(assertPersistedGroupActor(q.tx,ctx(),{mode:"MANUAL",collegeId:collegeA})).resolves.toBeUndefined();
  expect(q.locks).toEqual(["share","share","share"]);
  expect(q.remaining()).toBe(0);
 });

 it("COL-groups-ACTOR-02 rejects disabled users, removed membership, wrong tenant and revoked College Admin role",async()=>{
  const cases=[
   [[{status:"DISABLED"}]],
   [[]],
   [[active],[]],
   [[active],[{...membership,userId:"intruder"}]],
   [[active],[{...membership,collegeId:collegeB}]],
   [[active],[{...membership,status:"SUSPENDED"}]],
   [[active],[membership],[]],
  ] as Array<Array<Array<Record<string,unknown>>>>;
  for(const batches of cases){
   const q=fakeTx(batches);
   await expect(assertPersistedGroupActor(q.tx,ctx(),{mode:"MANUAL",collegeId:collegeA}))
     .rejects.toMatchObject({name:"GroupActorAccessError"});
   expect(q.locks.length).toBeGreaterThan(0);
  }
  await expect(assertPersistedGroupActor(fakeTx([[active]]).tx,{...ctx(),membership:null},
   {mode:"MANUAL",collegeId:collegeA})).rejects.toBeInstanceOf(GroupActorAccessError);
 });

 it("COL-groups-ACTOR-03 self-join allows only exactly the acting learner's own membership in its own college",async()=>{
  const c=ctx();
  await expect(assertPersistedGroupActor(fakeTx([[active],[membership],[{role:"LEARNER"}]]).tx,
   c,{mode:"SELF",collegeId:collegeA,memberId:"member"})).resolves.toBeUndefined();
  for(const [collegeId,memberId] of [[collegeB,"member"],[collegeA,"another"]]){
   await expect(assertPersistedGroupActor(fakeTx([[active]]).tx,c,
    {mode:"SELF",collegeId,memberId})).rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
  }
  await expect(assertPersistedGroupActor(fakeTx([[active],[membership],[]]).tx,c,
   {mode:"SELF",collegeId:collegeA,memberId:"member"})).rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
 });

 it("COL-groups-ACTOR-04 Super Admin is denied after persisted system-role revocation, regardless of stale session claims",async()=>{
  const actor:RequestContext={...ctx(),user:{...ctx().user,systemRoles:["SUPER_ADMIN"]},membership:null};
  await expect(assertPersistedGroupActor(fakeTx([[active],[{role:"SUPER_ADMIN"}]]).tx,
   actor,{mode:"MANUAL",collegeId:collegeA})).resolves.toBeUndefined();
  await expect(assertPersistedGroupActor(fakeTx([[active],[]]).tx,
   actor,{mode:"MANUAL",collegeId:collegeA})).rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
  await expect(assertPersistedGroupActor(fakeTx([[{status:"DISABLED"}]]).tx,
   actor,{mode:"MANUAL",collegeId:collegeA})).rejects.toMatchObject({code:"GROUP_ACTOR_INACTIVE"});
 });
});
