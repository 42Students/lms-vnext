import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 own:vi.fn(),select:vi.fn(),active:true,learner:true,
 submissions:[] as Array<{projectId:string;version:number;status:string}>,
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_ctx:unknown,role:string)=>state.learner&&role==="LEARNER",
}));
vi.mock("@/modules/projects/member-service",()=>({listMyProjectInstances:state.own}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {listMyLearnerProjectAttention} from "@/modules/projects/learner-attention-service";
const active="11111111-1111-4111-8111-111111111111";
const archived="22222222-2222-4222-8222-222222222222";
const foreign="33333333-3333-4333-8333-333333333333";
const ctx={} as RequestContext;
beforeEach(()=>{
 state.active=true;state.learner=true;
 state.submissions=[];state.own.mockReset().mockResolvedValue([
  {memberRole:"LEARNER",project:{id:active,status:"ACTIVE"}},
  {memberRole:"LEARNER",project:{id:archived,status:"ARCHIVED"}},
  {memberRole:"MENTOR",project:{id:foreign,status:"ACTIVE"}},
 ]);
 state.select.mockReset().mockImplementation(()=>({
  from(){return this;},where(){return this;},
  orderBy:async()=>state.submissions,
 }));
});
describe("PROJ-BREAK-LEARNER-100 project submission attention privacy",()=>{
 it("requires active learner role before looking up projects or drafts",async()=>{
  state.active=false;
  await expect(listMyLearnerProjectAttention(ctx)).rejects.toThrow();
  state.active=true;state.learner=false;
  await expect(listMyLearnerProjectAttention(ctx)).rejects.toThrow();
  expect(state.own).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("excludes archived learner and unrelated mentor projects from task attention",async()=>{
  state.submissions=[
   {projectId:active,version:2,status:"CHANGES_REQUESTED"},
   {projectId:archived,version:2,status:"DRAFT"},
   {projectId:foreign,version:1,status:"DRAFT"},
  ];
  expect(await listMyLearnerProjectAttention(ctx)).toEqual([
   {projectId:active,kind:"CHANGES_REQUESTED"},
  ]);
 });
 it("uses only latest submission status; previous draft must not override approved or submitted version",async()=>{
  state.submissions=[
   {projectId:active,version:3,status:"SUBMITTED"},
   {projectId:active,version:2,status:"CHANGES_REQUESTED"},
   {projectId:active,version:1,status:"DRAFT"},
  ];
  expect(await listMyLearnerProjectAttention(ctx)).toEqual([]);
  state.submissions[0]={projectId:active,version:4,status:"DRAFT"};
  expect(await listMyLearnerProjectAttention(ctx)).toEqual([{projectId:active,kind:"DRAFT"}]);
 });
 it("never queries a submission table when no active learner project is visible",async()=>{
  state.own.mockResolvedValue([]);
  expect(await listMyLearnerProjectAttention(ctx)).toEqual([]);
  expect(state.select).not.toHaveBeenCalled();
 });
});
