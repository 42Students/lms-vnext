import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorProjectActivityHistory} from "@/modules/projects/mentor-project-activity-service";
import {getMentorDeliveryReviewOverview} from "@/modules/projects/mentor-review-overview-service";
import {getMentorResourceDirectory} from "@/modules/projects/mentor-resource-directory-service";

const state=vi.hoisted(()=>({enabled:false,scopeCalls:0,dbCalls:0}));
const context={
 user:{id:"mentor",platformStatus:"ACTIVE"},
 membership:{id:"member",status:"ACTIVE",roles:["MENTOR"],
  collegeId:"college-a",organizationId:"org-a"},
} as unknown as RequestContext;
const projectId="11111111-1111-4111-8111-111111111111";
vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>true,hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR",
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>true}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async()=>{
  state.scopeCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,title:"PRIVATE IIT Project",status:"ACTIVE"}};
 },
}));
vi.mock("@/modules/projects/resource-service",()=>({
 listProjectResources:async()=>{throw new Error("Disabled project resolved resources");},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.dbCalls++;throw new Error("Unlicensed tenant queried database");},
}));
beforeEach(()=>{state.enabled=false;state.scopeCalls=0;state.dbCalls=0;});
describe("Private Mentor audit and review project data",()=>{
 it("PROJ-BREAK-MENTOR-239 conceals disabled-tenant activity project name and never resolves ID",async()=>{
  const view=await getMentorProjectActivityHistory(context,{projectId,page:2});
  expect(view.enabled).toBe(false);
  expect(view.title).toBe("");
  expect(JSON.stringify(view)).not.toContain("PRIVATE IIT Project");
  expect(view.items).toEqual([]);
  expect(state.scopeCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-240 denies review overview before a disabled tenant can enumerate project ID",async()=>{
  await expect(getMentorDeliveryReviewOverview(context,{projectId}))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.scopeCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-242 conceals disabled resource-directory project title and skips private resource reads",async()=>{
  const view=await getMentorResourceDirectory(context,{projectId});
  expect(view.enabled).toBe(false);
  expect(view.projectTitle).toBe("");
  expect(view.registered).toBe(0);
  expect(view.items).toEqual([]);
  expect(state.scopeCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-241 rejects forged activity and review tenant fields before resolving project identity",async()=>{
  await expect(getMentorProjectActivityHistory(context,{projectId,collegeId:"foreign"}))
   .rejects.toThrow();
  await expect(getMentorDeliveryReviewOverview(context,{projectId,organizationId:"foreign"}))
   .rejects.toThrow();
  expect(state.scopeCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
});
