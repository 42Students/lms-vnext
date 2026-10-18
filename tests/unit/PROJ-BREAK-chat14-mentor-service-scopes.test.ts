import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorReports} from "@/modules/projects/mentor-reports-service";
import {getMentorResourceDirectory} from "@/modules/projects/mentor-resource-directory-service";

const state=vi.hoisted(()=>({
 active:true,role:"MENTOR",enabled:true,allow:true,
 scopeRole:"MENTOR",scopeCollege:"college-a",resourceReads:0,
 rosterReads:0,attentionReads:0,taskReads:0,scopedProjectReads:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_:unknown,role:string)=>role===state.role,
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:(ctx:{membership?:{collegeId:string;organizationId:string}},_:string,resource:{collegeId:string;organizationId:string})=>
  state.allow&&Boolean(ctx.membership)&&ctx.membership!.collegeId===resource.collegeId&&
  ctx.membership!.organizationId===resource.organizationId,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/member-service",()=>({
 listMyProjectInstances:async()=>{
  state.rosterReads++;
  return [
   {project:{id:"project-a",title:"Atlas",status:"ACTIVE",updatedAt:new Date("2026-10-18T10:00:00Z")},
    memberRole:"MENTOR",isPrimaryMentor:true},
   {project:{id:"project-b",title:"Not a mentor assignment",status:"ACTIVE",updatedAt:new Date("2026-10-18T10:00:00Z")},
    memberRole:"LEARNER",isPrimaryMentor:false},
  ];
 },
}));
vi.mock("@/modules/projects/mentor-attention-service",()=>({
 listMyMentorProjectAttention:async()=>{
  state.attentionReads++;
  return [
   {key:"own",projectId:"project-a",kind:"REVIEW",title:"Review",description:"Review",href:"/mentor/projects/project-a",
    occurredAt:"2026-10-18T10:00:00Z"},
   {key:"other-college",projectId:"project-b",kind:"REVIEW",title:"Foreign",description:"Sensitive",
    href:"/mentor/projects/project-b",occurredAt:"2026-10-18T10:00:00Z"},
  ];
 },
}));
vi.mock("@/modules/projects/mentor-project-work-service",()=>({
 getMentorProjectWorkCounts:async()=>{
  state.taskReads++;
  return new Map([["project-a",{total:4,open:2}],["project-b",{total:100,open:0}]]);
 },
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async(_:unknown,id:string)=>{
  state.scopedProjectReads++;
  if(id!=="11111111-1111-4111-8111-111111111111")
   throw new Error("PROJECT_ACCESS_DENIED");
  return {access:state.scopeRole,collegeId:state.scopeCollege,organizationId:"org-a",
   project:{id,title:"Atlas",status:"ACTIVE"}};
 },
}));
vi.mock("@/modules/projects/resource-service",()=>({
 listProjectResources:async()=>{
  state.resourceReads++;
  return [
   {id:"resource-a",title:"Guide",description:"Shared",url:"https://example.edu/guide",required:true,sequence:1},
   {id:"resource-b",title:"Private reference",description:null,url:"https://user:pass@example.edu",required:false,sequence:2},
  ];
 },
}));

const PROJECT="11111111-1111-4111-8111-111111111111";
const actor={user:{id:"mentor",platformStatus:"ACTIVE"},
 membership:{id:"m-a",status:"ACTIVE",collegeId:"college-a",organizationId:"org-a",
  roles:["MENTOR"]}} as unknown as RequestContext;
beforeEach(()=>{
 state.active=true;state.role="MENTOR";state.enabled=true;state.allow=true;
 state.scopeRole="MENTOR";state.scopeCollege="college-a";
 state.resourceReads=0;state.rosterReads=0;state.attentionReads=0;
 state.taskReads=0;state.scopedProjectReads=0;
});

describe("PROJ-BREAK-MENTOR-46..54 service-level permission + scoped data assertions",()=>{
 it("PROJ-BREAK-MENTOR-46 report roster includes only active mentor assignments",async()=>{
  const report=await getMentorReports(actor,{status:"ACTIVE"});
  expect(report.enabled).toBe(true);
  expect(report.projectCount).toBe(1);
  expect(report.items.map(row=>row.id)).toEqual(["project-a"]);
  expect(report.attentionCounts.REVIEW).toBe(1);
  expect(JSON.stringify(report)).not.toContain("Sensitive");
  expect(state.rosterReads).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-47 report query with task-progress reads scoped task counts",async()=>{
  const report=await getMentorReports(actor,{order:"TASK_PROGRESS",taskCoverage:"OPEN_TASKS"});
  expect(report.total).toBe(1);
  expect(report.items[0].id).toBe("project-a");
  expect(state.taskReads).toBe(1);
  const regular=await getMentorReports(actor,{order:"UPDATED",taskCoverage:"ALL"});
  expect(regular.enabled).toBe(true);
  expect(state.taskReads).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-48 revoked role and suspended membership reject reports before any roster reads",async()=>{
  state.active=false;
  await expect(getMentorReports(actor,{})).rejects.toThrow("PROJECT_ACCESS_DENIED");
  state.active=true;state.role="LEARNER";
  await expect(getMentorReports(actor,{})).rejects.toThrow("PROJECT_ACCESS_DENIED");
  state.role="MENTOR";state.allow=false;
  await expect(getMentorReports(actor,{})).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.rosterReads).toBe(0);
  expect(state.attentionReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-49 disabled Projects reports do not fetch roster or attention",async()=>{
  state.enabled=false;
  const report=await getMentorReports(actor,{});
  expect(report.enabled).toBe(false);
  expect(report.projectCount).toBe(0);
  expect(report.items).toEqual([]);
  expect(state.rosterReads).toBe(0);
  expect(state.taskReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-50 reports reject forged query filters before reading any roster",async()=>{
  await expect(getMentorReports(actor,{collegeId:"college-b"})).rejects.toThrow();
  await expect(getMentorReports(actor,{page:10001})).rejects.toThrow();
  expect(state.rosterReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-51 resource directory requires active role and scoped project",async()=>{
  const result=await getMentorResourceDirectory(actor,{projectId:PROJECT,required:"REQUIRED"});
  expect(result.enabled).toBe(true);
  expect(result.items.map(row=>row.id)).toEqual(["resource-a"]);
  expect(state.resourceReads).toBe(1);
  expect(state.scopedProjectReads).toBe(1);
  state.scopeRole="LEARNER";
  await expect(getMentorResourceDirectory(actor,{projectId:PROJECT}))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  state.scopeRole="MENTOR";state.scopeCollege="college-b";
  await expect(getMentorResourceDirectory(actor,{projectId:PROJECT}))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.resourceReads).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-52 revoked roles, foreign IDs and invalid input cannot read resources",async()=>{
  state.role="FACULTY";
  await expect(getMentorResourceDirectory(actor,{projectId:PROJECT}))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  state.role="MENTOR";state.active=false;
  await expect(getMentorResourceDirectory(actor,{projectId:PROJECT}))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  state.active=true;
  await expect(getMentorResourceDirectory(actor,{projectId:"22222222-2222-4222-8222-222222222222"}))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(getMentorResourceDirectory(actor,{projectId:PROJECT,actorId:"spoof"}))
   .rejects.toThrow();
  expect(state.resourceReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-53 disabled Projects directory remains empty without storage reads",async()=>{
  state.enabled=false;
  const result=await getMentorResourceDirectory(actor,{projectId:PROJECT});
  expect(result.enabled).toBe(false);
  expect(result.items).toEqual([]);
  expect(state.resourceReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-54 credential-bearing URL never becomes safe output even for mentor",async()=>{
  const report=await getMentorResourceDirectory(actor,{projectId:PROJECT});
  const secret=report.items.find(row=>row.id==="resource-b");
  expect(secret?.safeUrl).toBeNull();
  expect(report.linkableCount).toBe(1);
  expect(JSON.stringify(report.items)).not.toContain("pass@example.edu");
 });
});
