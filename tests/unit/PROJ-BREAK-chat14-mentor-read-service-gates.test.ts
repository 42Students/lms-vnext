import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorRiskReadiness} from "@/modules/projects/mentor-risk-readiness-service";
import {getMentorDeliveryReviewOverview} from "@/modules/projects/mentor-review-overview-service";
import {getMentorProjectReviewCompleteness} from "@/modules/projects/mentor-review-completeness-service";
import {getMentorReviewHistory} from "@/modules/projects/mentor-review-history-service";
import {getMentorTaskReviewHistory} from "@/modules/projects/mentor-task-history-service";
import {getMentorTeamCoverage} from "@/modules/projects/mentor-team-coverage-service";

const state=vi.hoisted(()=>({
 active:true,role:true,permission:true,enabled:true,scopeAccess:"MENTOR",
 scopeCollege:"college-a",scopeOrganization:"org-a",
 dbCalls:0,rosterCalls:0,scopedCalls:0,readinessCalls:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR"&&state.role,
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:(context:{membership?:{collegeId:string;organizationId:string}},
  _:unknown,resource:{collegeId:string;organizationId:string})=>
   state.permission&&context.membership?.collegeId===resource.collegeId&&
   context.membership?.organizationId===resource.organizationId,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async(_:unknown,id:string)=>{
  state.scopedCalls++;
  return {access:state.scopeAccess,collegeId:state.scopeCollege,
   organizationId:state.scopeOrganization,
   project:{id,title:"Atlas",status:"ACTIVE"}};
 },
}));
vi.mock("@/modules/projects/member-service",()=>({
 listMyProjectInstances:async()=>{
  state.rosterCalls++;
  return [{memberRole:"MENTOR",isPrimaryMentor:true,
   project:{id:"11111111-1111-4111-8111-111111111111",
    title:"Atlas",status:"ACTIVE"}}];
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.dbCalls++;throw new Error("DB_READ_ATTEMPTED");},
}));
vi.mock("@/modules/projects/instance-service",()=>({
 getProjectInstanceWorkspace:async()=>{state.readinessCalls++;throw new Error("READINESS_FETCH");},
}));
vi.mock("@/modules/projects/readiness-service",()=>({
 getProjectReadiness:async()=>{state.readinessCalls++;throw new Error("READINESS_FETCH");},
}));
vi.mock("@/modules/projects/meeting-service",()=>({
 listProjectMeetings:async()=>{state.readinessCalls++;throw new Error("READINESS_FETCH");},
}));
const projectId="11111111-1111-4111-8111-111111111111";
const context=():RequestContext=>({
 user:{id:"mentor-a",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership-a",collegeId:"college-a",organizationId:"org-a",
  status:"ACTIVE",roles:["MENTOR"]},
} as unknown as RequestContext);
const queries=[
 {name:"risk readiness",run:()=>getMentorRiskReadiness(context(),{projectId})},
 {name:"final review overview",run:()=>getMentorDeliveryReviewOverview(context(),{projectId})},
 {name:"review completeness",run:()=>getMentorProjectReviewCompleteness(context(),{projectId})},
 {name:"final review history",run:()=>getMentorReviewHistory(context(),{})},
 {name:"task review history",run:()=>getMentorTaskReviewHistory(context(),{})},
 {name:"team coverage",run:()=>getMentorTeamCoverage(context(),{})},
] as const;
beforeEach(()=>{
 state.active=true;state.role=true;state.permission=true;state.enabled=true;
 state.scopeAccess="MENTOR";state.scopeCollege="college-a";state.scopeOrganization="org-a";
 state.dbCalls=0;state.rosterCalls=0;state.scopedCalls=0;state.readinessCalls=0;
});

describe("PROJ-BREAK-MENTOR-178..184 read-service access and disabled modules",()=>{
 it("PROJ-BREAK-MENTOR-178 revoked mentor role rejects six read surfaces before roster or DB",async()=>{
  state.role=false;
  for(const query of queries){
   await expect(query.run(),query.name).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(state.dbCalls).toBe(0);
  expect(state.rosterCalls).toBe(0);
  expect(state.scopedCalls).toBe(0);
  expect(state.readinessCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-179 suspended membership or denied permission rejects all reads",async()=>{
  for(const failure of ["suspended","permission"]){
   state.active=failure!=="suspended";
   state.permission=failure!=="permission";
   for(const query of queries){
    await expect(query.run(),query.name).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   }
  }
  expect(state.dbCalls).toBe(0);
  expect(state.rosterCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-180 module-off portfolio reads return disabled with no roster or DB",async()=>{
  state.enabled=false;
  const review=await getMentorReviewHistory(context(),{});
  const task=await getMentorTaskReviewHistory(context(),{});
  const team=await getMentorTeamCoverage(context(),{});
  const complete=await getMentorProjectReviewCompleteness(context(),{projectId});
  expect(review).toMatchObject({enabled:false,items:[],projects:[]});
  expect(task).toMatchObject({enabled:false,items:[]});
  expect(team).toMatchObject({enabled:false,projectCount:0,items:[]});
  expect(complete).toMatchObject({enabled:false,items:[],projectTitle:null});
  expect(state.dbCalls).toBe(0);
  expect(state.rosterCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-181 direct project pages reject foreign project scope before database",async()=>{
  state.scopeCollege="foreign-college";
  await expect(getMentorRiskReadiness(context(),{projectId}))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  await expect(getMentorDeliveryReviewOverview(context(),{projectId}))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  await expect(getMentorProjectReviewCompleteness(context(),{projectId}))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.dbCalls).toBe(0);
  expect(state.readinessCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-182 signed-in learner scoped as project reader cannot enumerate Mentor review facts",async()=>{
  state.scopeAccess="LEARNER";
  for(const read of [
   ()=>getMentorRiskReadiness(context(),{projectId}),
   ()=>getMentorDeliveryReviewOverview(context(),{projectId}),
   ()=>getMentorProjectReviewCompleteness(context(),{projectId}),
  ]){
   await expect(read()).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-183 valid same-tenant authorized reads reach real data dependencies",async()=>{
  await expect(getMentorRiskReadiness(context(),{projectId}))
   .rejects.toThrow("READINESS_FETCH");
  for(const read of [
   ()=>getMentorDeliveryReviewOverview(context(),{projectId}),
   ()=>getMentorProjectReviewCompleteness(context(),{projectId}),
   ()=>getMentorReviewHistory(context(),{}),
   ()=>getMentorTaskReviewHistory(context(),{}),
   ()=>getMentorTeamCoverage(context(),{}),
  ]){
   await expect(read()).rejects.toThrow("DB_READ_ATTEMPTED");
  }
  expect(state.readinessCalls).toBe(3);
  expect(state.dbCalls).toBe(5);
 });
 it("PROJ-BREAK-MENTOR-184 malformed exact project IDs reject before any query or resolver",async()=>{
  for(const read of [
   ()=>getMentorRiskReadiness(context(),{projectId:"../foreign"}),
   ()=>getMentorDeliveryReviewOverview(context(),{projectId:"not-uuid"}),
   ()=>getMentorProjectReviewCompleteness(context(),{projectId:"foreign"}),
  ]){
   await expect(read()).rejects.toThrow();
  }
  expect(state.scopedCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
});
