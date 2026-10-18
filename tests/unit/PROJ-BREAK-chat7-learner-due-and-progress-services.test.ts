import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 own:vi.fn(),select:vi.fn(),active:true,learner:true,
 tasks:[] as Array<{projectId:string;dueDate?:string|null;status:string}>,
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_ctx:unknown,role:string)=>state.learner&&role==="LEARNER",
}));
vi.mock("@/modules/projects/member-service",()=>({listMyProjectInstances:state.own}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {listMyLearnerProjectDueStates} from "@/modules/projects/learner-project-due-service";
import {listMyLearnerProjectProgress} from "@/modules/projects/learner-project-progress-service";
const ownId="11111111-1111-4111-8111-111111111111";
const foreignId="22222222-2222-4222-8222-222222222222";
const ctx={} as RequestContext;
beforeEach(()=>{
 state.active=true;state.learner=true;state.own.mockReset();
 state.own.mockResolvedValue([{memberRole:"LEARNER",project:{id:ownId,status:"ACTIVE"}},
  {memberRole:"MENTOR",project:{id:foreignId,status:"ACTIVE"}}]);
 state.tasks=[];
 state.select.mockReset().mockImplementation(()=>({
  from(){return this;},where(){return Promise.resolve(state.tasks);},
 }));
});
describe("PROJ-BREAK-LEARNER-99 due and project progress services",()=>{
 it("rejects inactive, removed and wrong-role learner contexts before any database read",async()=>{
  for(const invoke of [listMyLearnerProjectDueStates,listMyLearnerProjectProgress]){
   state.active=false;
   await expect(invoke(ctx,[ownId])).rejects.toThrow();
   state.active=true;state.learner=false;
   await expect(invoke(ctx,[ownId])).rejects.toThrow();
   state.learner=true;
  }
  expect(state.own).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("does not read task rows when no requested project is an active learner project",async()=>{
  expect(await listMyLearnerProjectDueStates(ctx,[foreignId])).toEqual([]);
  expect(await listMyLearnerProjectProgress(ctx,[foreignId])).toEqual([]);
  expect(state.select).not.toHaveBeenCalled();
 });
 it("returns no hidden project rows and de-duplicates own repeated project IDs",async()=>{
  state.tasks=[{projectId:ownId,dueDate:null,status:"TODO"},
   {projectId:foreignId,dueDate:"2000-01-01",status:"BLOCKED"}];
  const due=await listMyLearnerProjectDueStates(ctx,[ownId,foreignId,ownId]);
  expect(due).toEqual([{projectId:ownId,date:null,state:"No due date"}]);
  const progress=await listMyLearnerProjectProgress(ctx,[ownId,foreignId,ownId]);
  expect(progress).toEqual([{projectId:ownId,totalTasks:1,completedTasks:0,blockedTasks:0,percentage:0}]);
 });
 it("excludes completed tasks from due warnings; never fabricates progress for an empty project",async()=>{
  state.tasks=[{projectId:ownId,dueDate:"2000-01-01",status:"DONE"}];
  expect(await listMyLearnerProjectDueStates(ctx,[ownId])).toEqual([
   {projectId:ownId,date:null,state:"No due date"},
  ]);
  state.tasks=[];
  expect(await listMyLearnerProjectProgress(ctx,[ownId])).toEqual([
   {projectId:ownId,totalTasks:0,completedTasks:0,blockedTasks:0,percentage:null},
  ]);
 });
 it("rejects unbounded and malformed requested project IDs instead of widening database scope",async()=>{
  for(const ids of [["foreign"],Array.from({length:2001},()=>ownId)]){
   await expect(listMyLearnerProjectDueStates(ctx,ids)).rejects.toThrow();
   await expect(listMyLearnerProjectProgress(ctx,ids)).rejects.toThrow();
  }
  expect(state.select).not.toHaveBeenCalled();
 });
});
