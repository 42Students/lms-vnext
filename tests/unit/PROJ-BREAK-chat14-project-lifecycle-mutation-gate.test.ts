import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess}
 from "@/modules/projects/access";

const state=vi.hoisted(()=>({enabled:false,dbReads:0,roleChecks:0}));
const context={
 user:{id:"mentor",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",status:"ACTIVE",roles:["MENTOR"],
  collegeId:"college-a",organizationId:"org-a"},
} as unknown as RequestContext;
const projectId="11111111-1111-4111-8111-111111111111";
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.dbReads++;throw new Error("Unlicensed actor queried project metadata");},
}));
vi.mock("@/modules/identity/context",()=>({
 isSuperAdmin:()=>false,
 hasMembershipRole:()=>{state.roleChecks++;return false;},
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>false}));
beforeEach(()=>{state.enabled=false;state.dbReads=0;state.roleChecks=0;});

describe("Shared mutation gate protects hidden Projects tenant",()=>{
 it("PROJ-BREAK-MENTOR-250 rejects disabled tenant before role/project lookup for real and guessed IDs",async()=>{
  for(const id of [projectId,"not-a-valid-project-id"]){
   await expect(requireProjectLifecycleMutationAccess(context,id))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  }
  expect(state.dbReads).toBe(0);
  expect(state.roleChecks).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-251 enabled tenant still denies unprivileged role before project fetch",async()=>{
  state.enabled=true;
  await expect(requireProjectLifecycleMutationAccess(context,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.dbReads).toBe(0);
  expect(state.roleChecks).toBeGreaterThan(0);
 });
});
