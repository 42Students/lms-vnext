import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST as createMeeting} from "@/app/api/projects/[projectId]/meetings/route";
import {PATCH as editMeeting} from "@/app/api/projects/[projectId]/meetings/[meetingId]/route";
import {POST as requestMeeting} from "@/app/api/projects/[projectId]/meetings/request/route";
import {POST as transitionMeeting} from "@/app/api/projects/[projectId]/meetings/[meetingId]/transition/route";

const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
 origin:true,authReads:0,calls:[] as Array<{operation:string;args:unknown[]}>,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.origin}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  state.authReads++;
  return {user:{id:"mentor"},membership:{id:"member"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"The action could not be completed. Please retry."},
  {status:403}),
}));
vi.mock("@/modules/projects/meeting-service",()=>({
 scheduleProjectMeeting:async(...args:unknown[])=>{
  state.calls.push({operation:"schedule",args});
  return {id:meetingId};
 },
 requestProjectMeeting:async(...args:unknown[])=>{
  state.calls.push({operation:"request",args});
  return {id:meetingId};
 },
 transitionProjectMeeting:async(...args:unknown[])=>{
  state.calls.push({operation:"transition",args});
  return {id:meetingId};
 },
}));
type Run=(request:Request)=>Promise<Response>;
const routes:Array<{name:string;method:"POST"|"PATCH";run:Run;
 operation:string;recordId:string|null;status:number}>=[
 {name:"new meeting",method:"POST",run:(request)=>createMeeting(request,{
  params:Promise.resolve({projectId})}),operation:"schedule",recordId:null,status:201},
 {name:"updated meeting",method:"PATCH",run:(request)=>editMeeting(request,{
  params:Promise.resolve({projectId,meetingId})}),operation:"schedule",recordId:meetingId,status:200},
 {name:"learner request",method:"POST",run:(request)=>requestMeeting(request,{
  params:Promise.resolve({projectId})}),operation:"request",recordId:null,status:201},
 {name:"meeting decision",method:"POST",run:(request)=>transitionMeeting(request,{
  params:Promise.resolve({projectId,meetingId})}),operation:"transition",recordId:meetingId,status:200},
];
function req(method:string,body:string,contentType="application/json",contentLength?:number):Request{
 return new Request("https://lms.example.edu/api/projects/"+projectId,{
  method,headers:{"Content-Type":contentType,
   ...(contentLength===undefined?{}:{"Content-Length":String(contentLength)})},
  body,
 });
}
beforeEach(()=>{state.origin=true;state.authReads=0;state.calls=[];});

describe("PROJ-BREAK-MENTOR-359..364 bounded meeting command HTTP contract",()=>{
 it("PROJ-BREAK-MENTOR-359 all four meeting writes deny hostile origins before any auth or stream read",async()=>{
  state.origin=false;
  for(const route of routes){
   const response=await route.run(req(route.method,"{}"));
   expect(response.status,route.name).toBe(403);
   expect((await response.json()).error).toBe("INVALID_ORIGIN");
  }
  expect(state.calls).toHaveLength(0);
  expect(state.authReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-360 rejects declared payloads beyond 128 KiB without service calls",async()=>{
  for(const route of routes){
   const response=await route.run(req(route.method,"{}", "application/json",128*1024+1));
   expect(response.status,route.name).toBe(413);
   const payload=await response.json();
   expect(payload.error).toBe("PROJECT_COMMAND_BODY_TOO_LARGE");
   expect(payload.message).toContain("too large");
  }
  expect(state.calls).toHaveLength(0);
 });
 it("PROJ-BREAK-MENTOR-361 streams a 128 KiB + 1 byte body with the same bounded failure",async()=>{
  const huge=" ".repeat(128*1024+1);
  for(const route of routes){
   const response=await route.run(req(route.method,huge));
   expect(response.status,route.name).toBe(413);
  }
  expect(state.calls).toHaveLength(0);
 });
 it("PROJ-BREAK-MENTOR-362 rejects text/plain, invalid JSON and incorrect content lengths",async()=>{
  for(const route of routes){
   const unsupported=await route.run(req(route.method,"{}","text/plain"));
   expect(unsupported.status,route.name).toBe(415);
   expect((await unsupported.json()).message).toContain("sent as JSON");
   const corrupt=await route.run(req(route.method,"{broken"));
   expect(corrupt.status,route.name).toBe(400);
   const invalid=await route.run(req(route.method,"{}","application/json",-1));
   expect(invalid.status,route.name).toBe(400);
  }
  expect(state.calls).toHaveLength(0);
 });
 it("PROJ-BREAK-MENTOR-363 forwards one decoded command and exact route identifiers",async()=>{
  const body={title:"Mentor discussion",expectedUpdatedAt:"2099-01-01T00:00:00.000Z"};
  for(const route of routes){
   const response=await route.run(req(route.method,JSON.stringify(body),"application/problem+json"));
   expect(response.status,route.name).toBe(route.status);
   const payload=await response.json();
   expect(payload.meeting.id).toBe(meetingId);
  }
  expect(state.calls).toHaveLength(routes.length);
  for(let i=0;i<routes.length;i++){
   const {operation,recordId}=routes[i];
   const call=state.calls[i];
   expect(call.operation).toBe(operation);
   expect(call.args[1]).toBe(projectId);
   expect(call.args[operation==="request"?2:operation==="transition"?3:3]).toEqual(body);
   if(operation!=="request")expect(call.args[2]).toBe(recordId??null);
  }
 });
});
