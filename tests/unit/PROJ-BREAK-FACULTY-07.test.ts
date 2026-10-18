import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import type {PermissionTransaction} from "@/modules/permissions/persisted-actor";
import {assertPersistedProjectMutationActor}
  from "@/modules/projects/persisted-mentor-mutation";

const projectId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({
  actorCalls:0,memberReads:0,locks:0,actorRevoked:false,
  persistedRoles:["MENTOR","FACULTY"] as string[],
  persistedMemberId:"44444444-4444-4444-8444-444444444444",
  assignment:{
    role:"MENTOR",roleKind:"MENTOR",canMutate:true,
  } as {role:string;roleKind:string;canMutate:boolean}|null,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async (
    ctx:RequestContext,identity:RequestContext,permission:string,
    scope:{collegeId:string;organizationId:string},
  )=>{
    state.actorCalls++;
    if(state.actorRevoked||scope.collegeId!==collegeId||
      scope.organizationId!==organizationId||
      permission!=="projects.read"&&permission!=="projects.manage")
      throw new Error("Permission revoked");
    return {
      ...identity,
      membership:identity.membership?{
        ...identity.membership,id:state.persistedMemberId,
        roles:state.persistedRoles,
      }:null,
    };
  },
}));
const originalContext:RequestContext={
  user:{id:"55555555-5555-4555-8555-555555555555",
    identityUid:"faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:state.persistedMemberId,collegeId,organizationId,
    status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
function mockTx():PermissionTransaction{
  const chain={
    where:()=>chain,
    for:(lock:string)=>{if(lock==="share")state.locks++;return chain;},
    limit:async()=>{state.memberReads++;return state.assignment?[state.assignment]:[];},
  };
  const tx={select:()=>({from:()=>chain})};
  return tx as unknown as PermissionTransaction;
}
const scope=(access:"ADMIN"|"MENTOR"|"OBSERVER"|"LEARNER"="MENTOR")=>({
 project:{id:projectId},collegeId,organizationId,access,
});

describe("PROJ-BREAK-FACULTY-07 persisted Mentor write access, session revocation, racing grants",()=>{
 beforeEach(()=>{
  state.actorCalls=0;state.memberReads=0;state.locks=0;
  state.actorRevoked=false;state.persistedRoles=["MENTOR","FACULTY"];
  state.persistedMemberId="44444444-4444-4444-8444-444444444444";
  state.assignment={role:"MENTOR",roleKind:"MENTOR",canMutate:true};
 });
 it("accepts an assigned Mentor only after validating locked persisted actor and live project grant",async()=>{
  await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope()))
    .resolves.toBeUndefined();
  expect(state).toMatchObject({actorCalls:1,memberReads:1,locks:1});
 });
 it("denies a user disabled or role-revoked after page load before inspecting the project grant",async()=>{
  state.actorRevoked=true;
  await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope()))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  expect(state.memberReads).toBe(0);
  state.actorRevoked=false;state.persistedRoles=["FACULTY"];
  await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope()))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  expect(state.memberReads).toBe(0);
 });
 it("denies stale membership IDs after a workspace context switch",async()=>{
  state.persistedMemberId="66666666-6666-4666-8666-666666666666";
  await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope()))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  expect(state.memberReads).toBe(0);
 });
 it("denies ended, removed, observer, QA, reviewer and readonly Mentor grants",async()=>{
  for(const assignment of [
    null,
    {role:"MENTOR",roleKind:"OBSERVER",canMutate:false},
    {role:"MENTOR",roleKind:"REVIEWER",canMutate:false},
    {role:"MENTOR",roleKind:"QA",canMutate:false},
    {role:"MENTOR",roleKind:"MENTOR",canMutate:false},
  ]){
    state.assignment=assignment;
    await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope()))
      .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  }
  expect(state.memberReads).toBe(5);
 });
 it("accepts an explicitly writable co-Mentor role but never learner role as mutation",async()=>{
  state.assignment={role:"MENTOR",roleKind:"CO_MENTOR",canMutate:true};
  await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope()))
    .resolves.toBeUndefined();
  await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope("LEARNER")))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope("OBSERVER")))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
 });
 it("Admin mutation verifies persisted manage rights without requiring a Mentor membership grant",async()=>{
  state.persistedRoles=[];
  await expect(assertPersistedProjectMutationActor(mockTx(),originalContext,scope("ADMIN")))
    .resolves.toBeUndefined();
  expect(state).toMatchObject({actorCalls:1,memberReads:0,locks:0});
 });
});
