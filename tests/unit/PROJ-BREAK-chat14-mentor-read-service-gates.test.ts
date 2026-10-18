import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorRiskReadiness} from "@/modules/projects/mentor-risk-readiness-service";
import {getMentorDeliveryReviewOverview} from "@/modules/projects/mentor-review-overview-service";
import {getMentorProjectReviewCompleteness} from "@/modules/projects/mentor-review-completeness-service";
import {getMentorReviewHistory} from "@/modules/projects/mentor-review-history-service";
import {getMentorTaskReviewHistory} from "@/modules/projects/mentor-task-history-service";
import {getMentorTeamCoverage} from "@/modules/projects/mentor-team-coverage-service";
import {getMentorBoardReview} from "@/modules/projects/mentor-board-review-service";
import {getMentorProjectTimeline} from "@/modules/projects/mentor-project-timeline-service";
import {getMentorTeamHistory} from "@/modules/projects/mentor-team-history-service";
import {getMentorTeamMeetings} from "@/modules/projects/mentor-team-meetings-service";
import {getMentorSprintProgress} from "@/modules/projects/mentor-sprint-progress-service";
import {getMentorDeliveryVersion} from "@/modules/projects/mentor-delivery-version-service";

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
 AuthorizationError:class AuthorizationError extends Error{},
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
 {name:"sprint progress",run:()=>getMentorSprintProgress(context(),{})},
 {name:"delivery version",run:()=>getMentorDeliveryVersion(context(),{
   projectId,submissionId:"22222222-2222-4222-8222-222222222222"})},
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
  const progress=await getMentorSprintProgress(context(),{});
  await expect(getMentorDeliveryVersion(context(),{
   projectId,submissionId:"22222222-2222-4222-8222-222222222222",
  })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(review).toMatchObject({enabled:false,items:[],projects:[]});
  expect(task).toMatchObject({enabled:false,items:[]});
  expect(team).toMatchObject({enabled:false,projectCount:0,items:[]});
  expect(complete).toMatchObject({enabled:false,items:[],projectTitle:null});
  expect(progress).toMatchObject({enabled:false,items:[],projects:[]});
  expect(state.dbCalls).toBe(0);
  expect(state.rosterCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-185 disabled risk readiness hides all project evidence before scope lookup",async()=>{
  state.enabled=false;
  const result=await getMentorRiskReadiness(context(),{projectId});
  expect(result).toMatchObject({
   enabled:false,projectTitle:"",projectStatus:"",
   riskCount:0,readinessGapCount:0,total:0,items:[],
   counts:{blockedTasks:0,reviewTasks:0,pendingMeetings:0,
    scheduledPastDay:0,incompleteTasks:0},
  });
  expect(state.scopedCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
  expect(state.readinessCalls).toBe(0);
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
   ()=>getMentorSprintProgress(context(),{}),
   ()=>getMentorDeliveryVersion(context(),{
    projectId,submissionId:"22222222-2222-4222-8222-222222222222",
   }),
  ]){
   await expect(read()).rejects.toThrow("DB_READ_ATTEMPTED");
  }
  expect(state.readinessCalls).toBe(3);
  expect(state.dbCalls).toBe(7);
 });
 it("PROJ-BREAK-MENTOR-195 invalid exact delivery version IDs reject before scope or database access",async()=>{
  for(const bad of [
   {projectId,submissionId:"../../foreign"},
   {projectId:"invalid",submissionId:"22222222-2222-4222-8222-222222222222"},
   {projectId,submissionId:"22222222-2222-4222-8222-222222222222",collegeId:"other"},
  ]){
   await expect(getMentorDeliveryVersion(context(),bad)).rejects.toThrow();
  }
  expect(state.scopedCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-190 disabled board, timeline, team history and meeting log reveal no project metadata",async()=>{
  state.enabled=false;
  const board=await getMentorBoardReview(context(),{projectId});
  const timeline=await getMentorProjectTimeline(context(),{projectId});
  const history=await getMentorTeamHistory(context(),{projectId});
  const meetings=await getMentorTeamMeetings(context(),{projectId});
  expect(board).toMatchObject({enabled:false,projectTitle:"",items:[]});
  expect(timeline).toMatchObject({enabled:false,projectTitle:"",projectStatus:"",items:[]});
  expect(history).toMatchObject({enabled:false,title:"",items:[]});
  expect(meetings).toMatchObject({
   enabled:false,projectTitle:"",projectStatus:"",items:[],
   team:{learners:0,mentors:0,primaryRecorded:false},
  });
  expect(state.scopedCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
  expect(state.rosterCalls).toBe(0);
  expect(state.readinessCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-191 authorized board/timeline and team records do not falsely report disabled",async()=>{
  for(const read of [
   ()=>getMentorBoardReview(context(),{projectId}),
   ()=>getMentorProjectTimeline(context(),{projectId}),
  ])await expect(read()).rejects.toThrow("READINESS_FETCH");
  for(const read of [
   ()=>getMentorTeamHistory(context(),{projectId}),
   ()=>getMentorTeamMeetings(context(),{projectId}),
  ])await expect(read()).rejects.toThrow("DB_READ_ATTEMPTED");
  expect(state.scopedCalls).toBe(4);
  expect(state.readinessCalls).toBe(2);
  expect(state.dbCalls).toBe(2);
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
