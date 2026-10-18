import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorReviewQueue,getMentorPortfolioActivity} from "@/modules/projects/mentor-portfolio-service";
import {getMentorTaskReviews} from "@/modules/projects/mentor-task-review-service";

const state=vi.hoisted(()=>({
 active:true,role:"MENTOR",allowed:true,moduleEnabled:true,
 rosterCalls:0,attentionCalls:0,dbCalls:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_:unknown,role:string)=>state.role===role,
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:(ctx:{membership?:{collegeId:string;organizationId:string}},_:unknown,r:{collegeId:string;organizationId:string})=>
  state.allowed&&ctx.membership?.collegeId===r.collegeId&&ctx.membership?.organizationId===r.organizationId,
 requirePermission:()=>{if(!state.allowed)throw new Error("PROJECT_ACCESS_DENIED");},
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.moduleEnabled}}),
}));
vi.mock("@/modules/projects/member-service",()=>({
 listMyProjectInstances:async()=>{
  state.rosterCalls++;
  return [
   {project:{id:"11111111-1111-4111-8111-111111111111",title:"Atlas",status:"ACTIVE"},
    memberRole:"MENTOR",isPrimaryMentor:true},
   {project:{id:"22222222-2222-4222-8222-222222222222",title:"Foreign learner team",status:"ACTIVE"},
    memberRole:"LEARNER",isPrimaryMentor:false},
  ];
 },
}));
vi.mock("@/modules/projects/mentor-attention-service",()=>({
 listMyMentorProjectAttention:async()=>{
  state.attentionCalls++;
  return [
   {key:"review-a",kind:"REVIEW",projectId:"11111111-1111-4111-8111-111111111111",
    title:"Atlas",description:"Atlas submission",href:"/mentor/projects/11111111-1111-4111-8111-111111111111?tab=delivery",
    occurredAt:"2026-10-18T10:00:00Z"},
   {key:"review-b",kind:"REVIEW",projectId:"22222222-2222-4222-8222-222222222222",
    title:"Other",description:"Sensitive other team",href:"/mentor/projects/22222222-2222-4222-8222-222222222222",
    occurredAt:"2026-10-18T11:00:00Z"},
  ];
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.dbCalls++;throw new Error("UNEXPECTED_DB_READ");},
}));
const pid="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
const context={user:{id:"mentor",platformStatus:"ACTIVE"},
 membership:{id:"membership",status:"ACTIVE",collegeId:"college-a",organizationId:"org-a",
  roles:["MENTOR"]}} as unknown as RequestContext;

beforeEach(()=>{
 state.active=true;state.role="MENTOR";state.allowed=true;state.moduleEnabled=true;
 state.rosterCalls=0;state.attentionCalls=0;state.dbCalls=0;
});

describe("PROJ-BREAK-MENTOR-91..98 role/tenant and disabled-state portfolio service journeys",()=>{
 it("PROJ-BREAK-MENTOR-91 reviews contain only assigned Mentor project IDs, never a learner role",async()=>{
  const queue=await getMentorReviewQueue(context,{assignment:"ALL"});
  expect(queue.enabled).toBe(true);
  expect(queue.items.map(item=>item.projectId)).toEqual([pid]);
  expect(queue.items[0].description).toBe("Atlas submission");
  expect(JSON.stringify(queue)).not.toContain("Sensitive other team");
  expect(state.attentionCalls).toBe(1);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-92 direct foreign project ID lookup fails rather than returning an empty unscoped queue",async()=>{
  await expect(getMentorReviewQueue(context,{projectId:foreign}))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.attentionCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-93 supporting filter cannot fetch primary-only activity from database",async()=>{
  const activity=await getMentorPortfolioActivity(context,{assignment:"SUPPORTING"});
  expect(activity.enabled).toBe(true);
  expect(activity.items).toEqual([]);
  expect(activity.total).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-94 foreign activity ID fails closed before any DB read",async()=>{
  await expect(getMentorPortfolioActivity(context,{projectId:foreign}))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-95 task review queue rejects foreign project ID before scanning task records",async()=>{
  await expect(getMentorTaskReviews(context,{projectId:foreign}))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-96 primary-only assigned project gives no supporting task reviews",async()=>{
  const queue=await getMentorTaskReviews(context,{assignment:"SUPPORTING"});
  expect(queue.enabled).toBe(true);
  expect(queue.items).toEqual([]);
  expect(queue.total).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-97 a removed role or disabled identity prevents all portfolio reads",async()=>{
  for(const mode of ["inactive","wrong-role","no-permission"]){
   state.active=mode!=="inactive";state.role=mode==="wrong-role"?"LEARNER":"MENTOR";
   state.allowed=mode!=="no-permission";
   await expect(getMentorReviewQueue(context,{})).rejects.toThrow();
   await expect(getMentorTaskReviews(context,{})).rejects.toThrow();
   await expect(getMentorPortfolioActivity(context,{})).rejects.toThrow();
  }
  expect(state.dbCalls).toBe(0);
  expect(state.attentionCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-98 disabled module returns explicit empty states without task/event queries",async()=>{
  state.moduleEnabled=false;
  const reviews=await getMentorReviewQueue(context,{});
  const tasks=await getMentorTaskReviews(context,{});
  const activity=await getMentorPortfolioActivity(context,{});
  expect(reviews.enabled).toBe(false);
  expect(tasks.enabled).toBe(false);
  expect(activity.enabled).toBe(false);
  expect(reviews.items).toEqual([]);
  expect(tasks.items).toEqual([]);
  expect(activity.items).toEqual([]);
  expect(state.attentionCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
});
