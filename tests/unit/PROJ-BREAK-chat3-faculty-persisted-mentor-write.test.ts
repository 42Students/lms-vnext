import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({
 persisted:vi.fn(),rows:[] as Array<Record<string,unknown>>,
 queries:0,locks:0,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:stubs.persisted,
}));
import {assertPersistedProjectMutationActor} from "@/modules/projects/persisted-mentor-mutation";

const projectId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
function context(roles:readonly ("MENTOR"|"FACULTY"|"LEARNER"|"COLLEGE_ADMIN")[]=["FACULTY","MENTOR"]):RequestContext {
 return {
  user:{id:"faculty-mentor",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"membership",collegeId,organizationId,status:"ACTIVE",roles},
 };
}
const scope=(access:"ADMIN"|"MENTOR"|"LEARNER"|"OBSERVER")=>({
 project:{id:projectId},collegeId,organizationId,access,
});
const tx={
 select:()=>{
  stubs.queries++;
  class Query {
   from(){return this;}
   where(){return this;}
   for(){stubs.locks++;return this;}
   async limit(){return stubs.rows;}
  }
  return new Query();
 },
};
type Tx=Parameters<typeof assertPersistedProjectMutationActor>[0];
const persistedTransaction=tx as unknown as Tx;

beforeEach(()=>{
 vi.resetAllMocks();
 stubs.queries=0;stubs.locks=0;
 stubs.rows=[{role:"MENTOR",roleKind:"MENTOR",canMutate:true}];
 stubs.persisted.mockImplementation(async(_tx:unknown,actor:RequestContext)=>actor);
});

describe("PROJ-BREAK-chat3-FACULTY-03 persisted transaction role recheck",()=>{
 it("permits a current mutable Mentor or Co-Mentor only after persisted scope and shared row lock",async()=>{
  for(const roleKind of ["MENTOR","CO_MENTOR"]){
   stubs.rows=[{role:"MENTOR",roleKind,canMutate:true}];
   await expect(assertPersistedProjectMutationActor(persistedTransaction,
    context(),scope("MENTOR"))).resolves.toBeUndefined();
  }
  expect(stubs.persisted).toHaveBeenCalledTimes(2);
  expect(stubs.queries).toBe(2);
  expect(stubs.locks).toBe(2);
  expect(stubs.persisted).toHaveBeenCalledWith(persistedTransaction,
   expect.anything(),"projects.read",{collegeId,organizationId});
 });
 it("rejects a revoked, inactive or wrong persisted Mentor grant without granting Faculty authority",async()=>{
  for(const row of [
   null,{role:"MENTOR",roleKind:"OBSERVER",canMutate:false},
   {role:"MENTOR",roleKind:"MENTOR",canMutate:false},
   {role:"LEARNER",roleKind:"LEARNER",canMutate:true},
  ]){
   stubs.rows=row?[row]:[];
   await expect(assertPersistedProjectMutationActor(persistedTransaction,
    context(),scope("MENTOR"))).rejects.toMatchObject({
     code:"PROJECT_LIFECYCLE_ACCESS_DENIED",
    });
  }
  expect(stubs.queries).toBe(4);
 });
 it("denies a Faculty-only persisted identity despite a stale Mentor route grant",async()=>{
  stubs.persisted.mockResolvedValueOnce(context(["FACULTY"]));
  await expect(assertPersistedProjectMutationActor(persistedTransaction,
   context(),scope("MENTOR"))).rejects.toMatchObject({
   code:"PROJECT_LIFECYCLE_ACCESS_DENIED",
  });
  expect(stubs.queries).toBe(0);
 });
 it("denies persisted membership replacement after a college transfer or revocation",async()=>{
  const altered:RequestContext={...context(),
   membership:{...context().membership!,id:"replacement-membership"}};
  stubs.persisted.mockResolvedValueOnce(altered);
  await expect(assertPersistedProjectMutationActor(persistedTransaction,
   context(),scope("MENTOR"))).rejects.toMatchObject({
   code:"PROJECT_LIFECYCLE_ACCESS_DENIED",
  });
  expect(stubs.queries).toBe(0);
 });
 it("does not allow a forged Observer/Learner access level into the mutation transaction",async()=>{
  for(const access of ["LEARNER","OBSERVER"] as const){
   await expect(assertPersistedProjectMutationActor(persistedTransaction,
    context(),scope(access))).rejects.toMatchObject({
     code:"PROJECT_LIFECYCLE_ACCESS_DENIED",
    });
  }
  expect(stubs.persisted).not.toHaveBeenCalled();
  expect(stubs.queries).toBe(0);
 });
 it("returns a private lifecycle denial if the persisted transaction finds disabled/revoked permissions",async()=>{
  stubs.persisted.mockRejectedValueOnce(new Error("Internal revoked record ID"));
  await expect(assertPersistedProjectMutationActor(persistedTransaction,
   context(),scope("MENTOR"))).rejects.toMatchObject({
   code:"PROJECT_LIFECYCLE_ACCESS_DENIED",
  });
  expect(stubs.queries).toBe(0);
 });
 it("rechecks project-admin permissions through persisted platform authorization",async()=>{
  await expect(assertPersistedProjectMutationActor(persistedTransaction,
   context(["COLLEGE_ADMIN"]),scope("ADMIN"))).resolves.toBeUndefined();
  expect(stubs.persisted).toHaveBeenCalledWith(persistedTransaction,
   expect.anything(),"projects.manage",{collegeId,organizationId});
  expect(stubs.queries).toBe(0);
 });
});
