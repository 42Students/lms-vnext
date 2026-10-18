import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import type {PermissionTransaction} from "@/modules/permissions/persisted-actor";
import {assertPersistedFacultyTeachingMutation}
 from "@/modules/courses/faculty-persisted-teaching-guard";

const deliveryId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const membershipId="44444444-4444-4444-8444-444444444444";
const state=vi.hoisted(()=>({
 actorChecks:0,grantReads:0,grantLocks:0,actorDenied:false,
 persistedRoles:["FACULTY"] as string[],
 persistedId:"44444444-4444-4444-8444-444444444444",
 persistedStatus:"ACTIVE",
 persistedCollege:"22222222-2222-4222-8222-222222222222",
 persistedOrg:"33333333-3333-4333-8333-333333333333",
 grantPresent:true,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:async(
  _tx:unknown,context:RequestContext,permission:string,
  scope:{collegeId:string;organizationId:string},
 )=>{
  state.actorChecks++;
  if(state.actorDenied||permission!=="courses.read"||
   scope.collegeId!==collegeId||scope.organizationId!==organizationId)
   throw new Error("revoked");
  return {...context,membership:context.membership?{
   ...context.membership,
   id:state.persistedId,status:state.persistedStatus,
   roles:state.persistedRoles,
   collegeId:state.persistedCollege,organizationId:state.persistedOrg,
  }:null};
 },
}));
const context:RequestContext={
 user:{id:"55555555-5555-4555-8555-555555555555",
  identityUid:"teacher",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:membershipId,collegeId,organizationId,status:"ACTIVE",roles:["FACULTY"]},
};
const scope={collegeId,organizationId};
function transaction():PermissionTransaction{
 const chain={
  innerJoin:()=>chain,
  where:()=>chain,
  for:(mode:string)=>{if(mode==="share")state.grantLocks++;return chain;},
  limit:async()=>{state.grantReads++;return state.grantPresent?[{id:"teaching"}]:[];},
 };
 return {select:()=>({from:()=>chain})} as unknown as PermissionTransaction;
}
describe("COURSES-BREAK-FACULTY-12 persisted quiz publication rights at write time",()=>{
 beforeEach(()=>{
  state.actorChecks=0;state.grantReads=0;state.grantLocks=0;
  state.actorDenied=false;state.persistedRoles=["FACULTY"];
  state.persistedId=membershipId;state.persistedStatus="ACTIVE";
  state.persistedCollege=collegeId;state.persistedOrg=organizationId;
  state.grantPresent=true;
 });
 it("FAC-assessments-02 checks persisted Faculty actor then SHARE-locks exact live teaching grant",async()=>{
  await expect(assertPersistedFacultyTeachingMutation(transaction(),context,deliveryId,scope))
   .resolves.toBeUndefined();
  expect(state).toMatchObject({actorChecks:1,grantReads:1,grantLocks:1});
 });
 it("FAC-assessments-02 denied principal never inspects grant or writes",async()=>{
  state.actorDenied=true;
  await expect(assertPersistedFacultyTeachingMutation(transaction(),context,deliveryId,scope))
   .rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(state).toMatchObject({actorChecks:1,grantReads:0,grantLocks:0});
 });
 it("FAC-assessments-02 role, membership, college, org and status changes invalidate pending publication",async()=>{
  const mutations=[
   ()=>{state.persistedRoles=["MENTOR"];},
   ()=>{state.persistedId="66666666-6666-4666-8666-666666666666";},
   ()=>{state.persistedStatus="ENDED";},
   ()=>{state.persistedStatus="SUSPENDED";},
   ()=>{state.persistedCollege="77777777-7777-4777-8777-777777777777";},
   ()=>{state.persistedOrg="88888888-8888-4888-8888-888888888888";},
  ];
  for(const mutate of mutations){
   state.persistedRoles=["FACULTY"];state.persistedId=membershipId;
   state.persistedStatus="ACTIVE";state.persistedCollege=collegeId;
   state.persistedOrg=organizationId;
   mutate();
   await expect(assertPersistedFacultyTeachingMutation(transaction(),context,deliveryId,scope))
    .rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  }
  expect(state.grantReads).toBe(0);
 });
 it("FAC-assessments-02 ended or deleted teaching assignment rejects without exposing quiz data",async()=>{
  state.grantPresent=false;
  await expect(assertPersistedFacultyTeachingMutation(transaction(),context,deliveryId,scope))
   .rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(state).toMatchObject({actorChecks:1,grantReads:1,grantLocks:1});
 });
 it("FAC-assessments-02 no selected membership cannot bypass Faculty grant with Super Admin cookie",async()=>{
  const admin={...context,membership:null,user:{...context.user,systemRoles:["SUPER_ADMIN"] as const}};
  await expect(assertPersistedFacultyTeachingMutation(transaction(),admin,deliveryId,scope))
   .rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(state.actorChecks).toBe(0);
 });
});
