import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import {POST as decideMeeting} from "@/app/api/projects/[projectId]/meetings/[meetingId]/mentor-decision/route";
import {PATCH as rescheduleMeeting} from "@/app/api/projects/[projectId]/meetings/[meetingId]/mentor-reschedule/route";
import {POST as transitionSprint} from "@/app/api/projects/[projectId]/sprints/[sprintId]/mentor-transition/route";
import {PATCH as transitionTask} from "@/app/api/projects/[projectId]/tasks/[taskId]/mentor-transition/route";

const state=vi.hoisted(()=>({
 origin:true,contexts:0,calls:[] as Array<{service:string;args:unknown[]}>,reject:false,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.origin}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{state.contexts++;return {user:{id:"mentor"}};},
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:(_error:unknown)=>NextResponse.json({
  error:"PROJECT_WRITE_UNAVAILABLE",message:"Please retry your change."
 },{status:409}),
}));
vi.mock("@/modules/projects/mentor-meeting-decision-service",()=>({
 decideMentorProjectMeeting:async(...args:unknown[])=>{
  state.calls.push({service:"meetingDecision",args});
  if(state.reject)throw new Error("SQLSTATE_40001_PRIVATE");
  return {id:"meeting"};
 },
}));
vi.mock("@/modules/projects/mentor-meeting-reschedule-service",()=>({
 rescheduleMentorMeeting:async(...args:unknown[])=>{
  state.calls.push({service:"meetingReschedule",args});
  if(state.reject)throw new Error("SQLSTATE_40001_PRIVATE");
  return {id:"meeting"};
 },
}));
vi.mock("@/modules/projects/mentor-sprint-write-service",()=>({
 transitionMentorProjectSprint:async(...args:unknown[])=>{
  state.calls.push({service:"sprintTransition",args});
  if(state.reject)throw new Error("SQLSTATE_40001_PRIVATE");
  return {id:"sprint"};
 },
}));
vi.mock("@/modules/projects/mentor-task-transition-service",()=>({
 transitionMentorProjectTask:async(...args:unknown[])=>{
  state.calls.push({service:"taskTransition",args});
  if(state.reject)throw new Error("SQLSTATE_40001_PRIVATE");
  return {id:"task"};
 },
}));
const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const taskId="44444444-4444-4444-8444-444444444444";
type Runner=(request:Request)=>Promise<Response>;
const routes:Array<{name:string;method:"POST"|"PATCH";run:Runner;service:string}>= [
 {name:"meeting decision",method:"POST",service:"meetingDecision",
  run:(request)=>decideMeeting(request,{params:Promise.resolve({projectId,meetingId})})},
 {name:"meeting reschedule",method:"PATCH",service:"meetingReschedule",
  run:(request)=>rescheduleMeeting(request,{params:Promise.resolve({projectId,meetingId})})},
 {name:"sprint transition",method:"POST",service:"sprintTransition",
  run:(request)=>transitionSprint(request,{params:Promise.resolve({projectId,sprintId})})},
 {name:"task transition",method:"PATCH",service:"taskTransition",
  run:(request)=>transitionTask(request,{params:Promise.resolve({projectId,taskId})})},
];
function command(method:"POST"|"PATCH",contentType="application/json",
 content='{"confirmed":true}',length?:string):Request{
 return new Request("https://lms.example.edu/api/projects/"+projectId,{
  method,headers:{"content-type":contentType,...(length?{"content-length":length}:{})},
  body:content,
 });
}
beforeEach(()=>{state.origin=true;state.contexts=0;state.calls=[];state.reject=false;});

describe("PROJ-BREAK-MENTOR-168..172 authenticated HTTP command boundaries",()=>{
 it("PROJ-BREAK-MENTOR-168 same-origin denial precedes every write service and body decoder",async()=>{
  state.origin=false;
  for(const route of routes){
   const response=await route.run(command(route.method,"text/plain","not-json"));
   expect(response.status,route.name).toBe(403);
   expect((await response.json()).error).toBe("INVALID_ORIGIN");
  }
  expect(state.calls).toHaveLength(0);
  expect(state.contexts).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-169 unsupported content type returns friendly 415 without writing",async()=>{
  for(const route of routes){
   const response=await route.run(command(route.method,"text/plain","not-json"));
   expect(response.status,route.name).toBe(415);
   const payload=await response.json();
   expect(payload.error).toBe("UNSUPPORTED_PROJECT_COMMAND_CONTENT_TYPE");
   expect(payload.message).toContain("sent as JSON");
  }
  expect(state.calls).toHaveLength(0);
 });
 it("PROJ-BREAK-MENTOR-170 oversized declared command is rejected before persistence",async()=>{
  for(const route of routes){
   const response=await route.run(command(route.method,"application/json","{}",String(128*1024+1)));
   expect(response.status,route.name).toBe(413);
   expect((await response.json()).message).toContain("too large");
  }
  expect(state.calls).toHaveLength(0);
 });
 it("PROJ-BREAK-MENTOR-171 valid commands use decoded JSON with authenticated path IDs",async()=>{
  for(const route of routes){
   const response=await route.run(command(route.method,"application/json",'{"confirmed":true,"notes":"ok"}'));
   expect(response.status,route.name).toBe(200);
   const payload=await response.json();
   expect(payload).toHaveProperty(route.service==="sprintTransition"?"sprint":
    route.service==="taskTransition"?"task":"meeting");
  }
  expect(state.calls).toHaveLength(4);
  for(const route of routes){
   const call=state.calls.find(x=>x.service===route.service);
   expect(call).toBeDefined();
   expect(call?.args).toContainEqual({confirmed:true,notes:"ok"});
   expect(JSON.stringify(call?.args)).toContain(projectId);
  }
 });
 it("PROJ-BREAK-MENTOR-172 opaque storage or stale exceptions never expose backend details",async()=>{
  state.reject=true;
  for(const route of routes){
   const response=await route.run(command(route.method));
   expect(response.status).toBe(409);
   const body=await response.text();
   expect(body).toContain("Please retry your change.");
   expect(body).not.toContain("SQLSTATE_40001_PRIVATE");
  }
  expect(state.calls).toHaveLength(4);
 });
});
