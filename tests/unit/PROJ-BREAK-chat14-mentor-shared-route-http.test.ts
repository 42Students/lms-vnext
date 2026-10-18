import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST as autoAssign} from "@/app/api/projects/[projectId]/tasks/auto-assign/route";
import {PATCH as moveBacklog,POST as createBacklog} from "@/app/api/projects/[projectId]/backlog/route";
import {POST as createRelease} from "@/app/api/projects/[projectId]/releases/route";
import {POST as createTask} from "@/app/api/projects/[projectId]/tasks/route";
import {GET as listResources,POST as createResource} from "@/app/api/projects/[projectId]/resources/route";
import {GET as listMeetings,POST as createMeeting} from "@/app/api/projects/[projectId]/meetings/route";

const state=vi.hoisted(()=>({
 origin:true,signedIn:true,role:"MENTOR",contexts:0,
 calls:[] as {service:string;args:unknown[]}[],
}));
function called(service:string,...args:unknown[]) {
 state.calls.push({service,args});
 return {id:"22222222-2222-4222-8222-222222222222",title:service};
}
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.origin}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  state.contexts++;
  if(!state.signedIn)throw new Error("AUTH_REQUIRED");
  return {user:{id:"mentor"},membership:{id:"member"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"AUTH_REQUIRED"},{status:401}),
}));
vi.mock("@/modules/projects/mentor-auto-assign-service",()=>({
 autoAssignProjectTasks:async(...args:unknown[])=>called("autoAssign",...args),
}));
vi.mock("@/modules/projects/mentor-backlog-service",()=>({
 moveMentorBacklogTask:async(...args:unknown[])=>called("moveBacklog",...args),
 createMentorBacklogTask:async(...args:unknown[])=>called("createBacklog",...args),
}));
vi.mock("@/modules/projects/mentor-release-write-service",()=>({
 writeMentorProjectRelease:async(...args:unknown[])=>called("createRelease",...args),
}));
vi.mock("@/modules/projects/mentor-task-create-service",()=>({
 createMentorProjectTask:async(...args:unknown[])=>called("createMentorTask",...args),
}));
vi.mock("@/modules/projects/learner-own-task-service",()=>({
 createLearnerOwnTask:async(...args:unknown[])=>called("createLearnerTask",...args),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async()=>({access:state.role}),
}));
vi.mock("@/modules/projects/resource-service",()=>({
 createProjectResource:async(...args:unknown[])=>called("createResource",...args),
 listProjectResources:async(...args:unknown[])=>{
  called("listResources",...args);
  return [{id:"resource"}];
 },
}));
vi.mock("@/modules/projects/meeting-service",()=>({
 scheduleProjectMeeting:async(...args:unknown[])=>called("createMeeting",...args),
 listProjectMeetings:async(...args:unknown[])=>{
  called("listMeetings",...args);
  return [{id:"meeting"}];
 },
}));
const projectId="11111111-1111-4111-8111-111111111111";
type Ctx={params:Promise<{projectId:string}>};
type Handler=(r:Request,c:Ctx)=>Promise<Response>;
const route=(handler:Handler)=>(request:Request)=>handler(request,{params:Promise.resolve({projectId})});
const writes:{name:string;method:"POST"|"PATCH";handler:Handler;service:string}[]=[
 {name:"task auto-assign",method:"POST",handler:autoAssign,service:"autoAssign"},
 {name:"backlog move",method:"PATCH",handler:moveBacklog,service:"moveBacklog"},
 {name:"backlog create",method:"POST",handler:createBacklog,service:"createBacklog"},
 {name:"release create",method:"POST",handler:createRelease,service:"createRelease"},
 {name:"task create",method:"POST",handler:createTask,service:"createMentorTask"},
 {name:"resource create",method:"POST",handler:createResource,service:"createResource"},
 {name:"meeting create",method:"POST",handler:createMeeting,service:"createMeeting"},
];
const request=(method:"POST"|"PATCH"|"GET",body='{"title":"Sprint checkpoint"}')=>
 new Request("https://lms.example.edu/api/projects/"+projectId,{
  method,headers:{"content-type":"application/json"},
  ...(method==="GET"?{}:{body}),
 });
beforeEach(()=>{state.origin=true;state.signedIn=true;state.role="MENTOR";
 state.contexts=0;state.calls=[];});

describe("PROJ-BREAK-MENTOR-205..210 shared project HTTP authorization and role dispatch",()=>{
 it("PROJ-BREAK-MENTOR-205 all seven mutation endpoints reject cross-origin before auth or persistence",async()=>{
  state.origin=false;
  for(const entry of writes){
   const response=await route(entry.handler)(request(entry.method));
   expect(response.status,entry.name).toBe(403);
   expect((await response.json()).error).toBe("INVALID_ORIGIN");
  }
  expect(state.contexts).toBe(0);
  expect(state.calls).toHaveLength(0);
 });
 it("PROJ-BREAK-MENTOR-206 an unauthenticated caller cannot mutate across seven endpoints",async()=>{
  state.signedIn=false;
  for(const entry of writes){
   const response=await route(entry.handler)(request(entry.method));
   expect(response.status,entry.name).toBe(401);
  }
  expect(state.calls).toHaveLength(0);
 });
 it("PROJ-BREAK-MENTOR-207 authorized mutations delegate exact project scope and JSON once",async()=>{
  for(const entry of writes){
   const response=await route(entry.handler)(request(entry.method));
   expect(response.status,entry.name).toBe(
    ["createBacklog","createRelease","createMentorTask","createResource","createMeeting"]
     .includes(entry.service)?201:200);
  }
  expect(state.calls).toHaveLength(writes.length);
  for(const entry of writes){
   const call=state.calls.find(call=>call.service===entry.service);
   expect(call?.args[1]).toEqual(entry.service==="createMentorTask"?{projectId}:projectId);
   if(entry.service!=="autoAssign"){
    const body=call?.args.find(value=>Boolean(value)&&typeof value==="object"&&
      Object.hasOwn(value,"title"));
    expect(body).toMatchObject({title:"Sprint checkpoint"});
   }
  }
 });
 it("PROJ-BREAK-MENTOR-208 task creation dispatches learner to own-task path, never mentor path",async()=>{
  state.role="LEARNER";
  const response=await route(createTask)(request("POST"));
  expect(response.status).toBe(201);
  expect(state.calls.map(x=>x.service)).toEqual(["createLearnerTask"]);
 });
 it("PROJ-BREAK-MENTOR-209 read-only resource and meeting GET calls do not trigger any mutator",async()=>{
  const resources=await route(listResources)(request("GET"));
  const meetings=await route(listMeetings)(request("GET"));
  expect(resources.status).toBe(200);
  expect(meetings.status).toBe(200);
  expect((await resources.json()).resources).toEqual([{id:"resource"}]);
  expect((await meetings.json()).meetings).toEqual([{id:"meeting"}]);
  expect(state.calls.map(call=>call.service)).toEqual(["listResources","listMeetings"]);
 });
 it("PROJ-BREAK-MENTOR-210 malformed JSON never reaches create/update service",async()=>{
  for(const entry of writes.filter(x=>x.service!=="autoAssign")){
   state.calls=[];
   const response=await route(entry.handler)(request(entry.method,"{"));
   expect(response.status,entry.name).toBe(401);
   expect(state.calls).toHaveLength(0);
  }
 });
});
