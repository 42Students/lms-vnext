import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST as createRelease} from "@/app/api/projects/[projectId]/releases/route";
import {PATCH as updateRelease,DELETE as deleteRelease}
 from "@/app/api/projects/[projectId]/releases/[releaseId]/route";
import {POST as createSprint} from "@/app/api/projects/[projectId]/sprints/route";
import {PATCH as updateSprint,DELETE as deleteSprint}
 from "@/app/api/projects/[projectId]/sprints/[sprintId]/route";
import {PATCH as updateTask} from "@/app/api/projects/[projectId]/tasks/[taskId]/details/route";
import {MENTOR_PROJECT_COMMAND_LIMIT_BYTES} from "@/modules/projects/mentor-command-body";

const state=vi.hoisted(()=>({
 origin:true,auth:true,authReads:0,writes:0,body:null as unknown,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const releaseId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const taskId="44444444-4444-4444-8444-444444444444";
const one={params:Promise.resolve({projectId})};
const release={params:Promise.resolve({projectId,releaseId})};
const sprint={params:Promise.resolve({projectId,sprintId})};
const task={params:Promise.resolve({projectId,taskId})};
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.origin}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  state.authReads++;
  if(!state.auth)throw new Error("AUTH_REQUIRED");
  return {user:{id:"mentor"},membership:{id:"member"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"Unable to complete action"},{status:403}),
}));
function write(body:unknown){
 state.writes++;state.body=body;
 return {id:"result",title:"Recorded"};
}
vi.mock("@/modules/projects/mentor-release-write-service",()=>({
 writeMentorProjectRelease:async(_actor:unknown,_pid:string,_rid:string|null,
  _method:string,body:unknown)=>write(body),
}));
vi.mock("@/modules/projects/mentor-sprint-write-service",()=>({
 createMentorProjectSprint:async(_actor:unknown,_path:unknown,body:unknown)=>write(body),
}));
vi.mock("@/modules/projects/mentor-sprint-details-service",()=>({
 updateMentorSprintDetails:async(_actor:unknown,_path:unknown,body:unknown)=>write(body),
}));
vi.mock("@/modules/projects/mentor-sprint-delete-service",()=>({
 deleteMentorProjectSprint:async(_actor:unknown,_path:unknown,body:unknown)=>write(body),
}));
vi.mock("@/modules/projects/mentor-task-details-service",()=>({
 updateMentorTaskDetails:async(_actor:unknown,_path:unknown,body:unknown)=>write(body),
}));
const routes=[
 {name:"release create",method:"POST",invoke:(r:Request)=>createRelease(r,one)},
 {name:"release edit",method:"PATCH",invoke:(r:Request)=>updateRelease(r,release)},
 {name:"release delete",method:"DELETE",invoke:(r:Request)=>deleteRelease(r,release)},
 {name:"Sprint create",method:"POST",invoke:(r:Request)=>createSprint(r,one)},
 {name:"Sprint edit",method:"PATCH",invoke:(r:Request)=>updateSprint(r,sprint)},
 {name:"Sprint delete",method:"DELETE",invoke:(r:Request)=>deleteSprint(r,sprint)},
 {name:"task edit",method:"PATCH",invoke:(r:Request)=>updateTask(r,task)},
];
function build(method:string,body:BodyInit,options?:{
 contentType?:string;declaredLength?:string,
}){
 return new Request("https://campus.example/api/projects/"+projectId,{
  method,headers:{
   "content-type":options?.contentType??"application/json",
   ...(options?.declaredLength?{"content-length":options.declaredLength}:{}),
  },body,
 });
}
beforeEach(()=>{
 state.origin=true;state.auth=true;state.authReads=0;state.writes=0;state.body=null;
});
describe("Mentor release Sprint and task write JSON body limits",()=>{
 for(const route of routes){
  it("PROJ-BREAK-MENTOR-345 "+route.name+" rejects too-large declared content before service",async()=>{
   const req=build(route.method,"{}",{declaredLength:String(MENTOR_PROJECT_COMMAND_LIMIT_BYTES+1)});
   const response=await route.invoke(req);
   expect(response.status).toBe(413);
   expect(await response.json()).toMatchObject({
    error:"PROJECT_COMMAND_BODY_TOO_LARGE",
    message:"This update is too large. Shorten the notes and retry.",
   });
   expect(state.writes).toBe(0);
  });
  it("PROJ-BREAK-MENTOR-346 "+route.name+" rejects unsupported content type",async()=>{
   const response=await route.invoke(build(route.method,"title=x",{
    contentType:"application/x-www-form-urlencoded",
   }));
   expect(response.status).toBe(415);
   expect(state.writes).toBe(0);
  });
  it("PROJ-BREAK-MENTOR-347 "+route.name+" fails closed on malformed JSON",async()=>{
   const response=await route.invoke(build(route.method,"{broken JSON"));
   expect(response.status).toBe(400);
   expect(await response.json()).toMatchObject({error:"INVALID_PROJECT_COMMAND_BODY"});
   expect(state.writes).toBe(0);
  });
  it("PROJ-BREAK-MENTOR-348 "+route.name+" passes accepted JSON unchanged once",async()=>{
   const value={title:"Sprint update",expectedUpdatedAt:"2099-01-01T00:00:00.000Z"};
   const response=await route.invoke(build(route.method,JSON.stringify(value)));
   expect(response.status).toBeGreaterThanOrEqual(200);
   expect(response.status).toBeLessThan(300);
   expect(state.writes).toBe(1);
   expect(state.body).toEqual(value);
  });
 }
 it("PROJ-BREAK-MENTOR-349 stream byte budget is enforced even with no content-length header",async()=>{
  const text=JSON.stringify({notes:"x".repeat(MENTOR_PROJECT_COMMAND_LIMIT_BYTES)});
  const response=await updateTask(build("PATCH",text),task);
  expect(response.status).toBe(413);
  expect(state.writes).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-350 forged origin prevents auth and JSON consumption",async()=>{
  state.origin=false;
  const response=await createRelease(build("POST","{}"),one);
  expect(response.status).toBe(403);
  expect(state.authReads).toBe(0);
  expect(state.writes).toBe(0);
 });
});
