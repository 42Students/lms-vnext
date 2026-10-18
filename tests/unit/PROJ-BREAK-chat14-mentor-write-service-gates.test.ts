import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {autoAssignProjectTasks} from "@/modules/projects/mentor-auto-assign-service";
import {moveMentorBacklogTask,createMentorBacklogTask} from "@/modules/projects/mentor-backlog-service";
import {deleteMentorProjectSprint} from "@/modules/projects/mentor-sprint-delete-service";
import {deleteMentorProjectTask} from "@/modules/projects/mentor-task-delete-service";
import {lockMentorFinalDelivery} from "@/modules/projects/mentor-delivery-lock-service";

const state=vi.hoisted(()=>({authorized:false,scopeCalls:0,dbCalls:0}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async(_:unknown,id:string)=>{
  state.scopeCalls++;
  if(!state.authorized)throw new Error("FORBIDDEN_SCOPE");
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id,title:"Atlas",status:"ACTIVE"}};
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.dbCalls++;throw new Error("DB_TRANSACTION_STARTED");},
}));
const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const submissionId="44444444-4444-4444-8444-444444444444";
const timestamp="2099-01-01T10:00:00.000Z";
const ctx={user:{id:"mentor",platformStatus:"ACTIVE"},
 membership:{id:"member",collegeId:"college-a",organizationId:"org-a",
  status:"ACTIVE",roles:["MENTOR"]}} as unknown as RequestContext;
type Runner=()=>Promise<unknown>;
const commands:Array<{name:string;run:Runner}>= [
 {name:"auto task assignment",run:()=>autoAssignProjectTasks(ctx,projectId)},
 {name:"move backlog task",run:()=>moveMentorBacklogTask(ctx,projectId,{
  taskId,targetSprintId:null,expectedUpdatedAt:timestamp})},
 {name:"create backlog task",run:()=>createMentorBacklogTask(ctx,projectId,{title:"Architecture task"})},
 {name:"unlink sprint",run:()=>deleteMentorProjectSprint(ctx,{projectId,sprintId},{
  expectedUpdatedAt:timestamp,confirmUnlink:true})},
 {name:"delete task",run:()=>deleteMentorProjectTask(ctx,projectId,taskId,{
  expectedUpdatedAt:timestamp,confirm:true})},
 {name:"lock delivery",run:()=>lockMentorFinalDelivery(ctx,projectId,submissionId,{
  reason:"Reviewed delivery",expectedUpdatedAt:timestamp})},
];
beforeEach(()=>{state.authorized=false;state.scopeCalls=0;state.dbCalls=0;});

describe("PROJ-BREAK-MENTOR-186..189 mentor write services fail closed",()=>{
 it("PROJ-BREAK-MENTOR-186 unauthorised project ID never starts transaction across six commands",async()=>{
  for(const command of commands){
   await expect(command.run(),command.name).rejects.toThrow("FORBIDDEN_SCOPE");
  }
  expect(state.scopeCalls).toBe(commands.length);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-187 valid mentor commands enter the authoritative database transaction",async()=>{
  state.authorized=true;
  for(const command of commands){
   await expect(command.run(),command.name).rejects.toThrow("DB_TRANSACTION_STARTED");
  }
  expect(state.scopeCalls).toBe(commands.length);
  expect(state.dbCalls).toBe(commands.length);
 });
 it("PROJ-BREAK-MENTOR-188 malformed paths and missing confirmations do not even ask for scope",async()=>{
  const invalid:Array<Runner>=[
   ()=>moveMentorBacklogTask(ctx,projectId,{taskId,targetSprintId:null}),
   ()=>moveMentorBacklogTask(ctx,projectId,{taskId:"../../other",targetSprintId:null,
     expectedUpdatedAt:timestamp}),
   ()=>createMentorBacklogTask(ctx,projectId,{title:""}),
   ()=>createMentorBacklogTask(ctx,projectId,{title:"Task",collegeId:"foreign"}),
   ()=>deleteMentorProjectSprint(ctx,{projectId,sprintId},{
     expectedUpdatedAt:timestamp,confirmUnlink:false}),
   ()=>deleteMentorProjectTask(ctx,projectId,taskId,{expectedUpdatedAt:timestamp}),
   ()=>lockMentorFinalDelivery(ctx,projectId,submissionId,{reason:"",expectedUpdatedAt:timestamp}),
  ];
  for(const run of invalid)await expect(run()).rejects.toThrow();
  expect(state.scopeCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-189 service boundary does not accept forged invalid project IDs for deletes or lock",async()=>{
  for(const run of [
   ()=>deleteMentorProjectTask(ctx,"../../foreign",taskId,{expectedUpdatedAt:timestamp,confirm:true}),
   ()=>deleteMentorProjectSprint(ctx,{projectId:"not-uuid",sprintId},{
     expectedUpdatedAt:timestamp,confirmUnlink:true}),
   ()=>lockMentorFinalDelivery(ctx,projectId,"invalid",{reason:"Review",expectedUpdatedAt:timestamp}),
  ])await expect(run()).rejects.toThrow();
  expect(state.scopeCalls).toBe(0);
  expect(state.dbCalls).toBe(0);
 });
});
