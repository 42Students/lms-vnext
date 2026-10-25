import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST as createSprint} from "@/app/api/projects/[projectId]/sprints/route";
import {PATCH as editSprint,DELETE as deleteSprint}
 from "@/app/api/projects/[projectId]/sprints/[sprintId]/route";
import {POST as startSprint} from "@/app/api/projects/[projectId]/sprints/[sprintId]/start/route";
import {POST as completeSprint} from "@/app/api/projects/[projectId]/sprints/[sprintId]/complete/route";
import {POST as reopenSprint} from "@/app/api/projects/[projectId]/sprints/[sprintId]/reopen/route";
import {POST as createTask} from "@/app/api/projects/[projectId]/tasks/route";
import {PATCH as editTaskDetails} from "@/app/api/projects/[projectId]/tasks/[taskId]/details/route";
import {PATCH as transitionTask,DELETE as deleteTask}
 from "@/app/api/projects/[projectId]/tasks/[taskId]/route";

const state=vi.hoisted(()=>({
 sameOrigin:true,authenticated:true,allowed:true,access:"MENTOR",
 authCalls:0,scopes:0,reads:0,writes:0,lastOperation:"",lastBody:null as unknown,
 lastProjectId:"",lastObjectId:"",
}));
const projectId="11111111-1111-4111-8111-111111111111";
const sprintId="22222222-2222-4222-8222-222222222222";
const taskId="33333333-3333-4333-8333-333333333333";
const actor={user:{id:"mentor"},membership:{id:"member",collegeId:"college-a"}};
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.sameOrigin}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  state.authCalls++;
  if(!state.authenticated)throw new Error("AUTH_REQUIRED");
  return actor;
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"The action could not be completed. Try again."},
  {status:403}),
}));
function write(operation:string,pid:string,id:string|null,body?:unknown){
 if(!state.allowed)throw new Error("PROJECT_ACCESS_DENIED");
 state.lastOperation=operation;state.lastProjectId=pid;
 state.lastObjectId=id??"";state.lastBody=body;state.writes++;
 return {id:id??"new-item",projectId:pid,status:"ACTIVE"};
}
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async()=>{
  state.scopes++;
  if(!state.allowed)throw new Error("PROJECT_ACCESS_DENIED");
  return {access:state.access};
 },
}));
vi.mock("@/modules/projects/mentor-sprint-write-service",()=>({
 createMentorProjectSprint:async(_:unknown,path:{projectId:string},body:unknown)=>
  write("sprint-create",path.projectId,null,body),
}));
vi.mock("@/modules/projects/mentor-sprint-details-service",()=>({
 updateMentorSprintDetails:async(_:unknown,path:{projectId:string;sprintId:string},body:unknown)=>
  write("sprint-edit",path.projectId,path.sprintId,body),
}));
vi.mock("@/modules/projects/mentor-sprint-delete-service",()=>({
 deleteMentorProjectSprint:async(_:unknown,path:{projectId:string;sprintId:string},body:unknown)=>
  write("sprint-delete",path.projectId,path.sprintId,body),
}));
vi.mock("@/modules/projects/mentor-task-create-service",()=>({
 createMentorProjectTask:async(_:unknown,path:{projectId:string},body:unknown)=>
  write("task-create",path.projectId,null,body),
}));
vi.mock("@/modules/projects/learner-own-task-service",()=>({
 createLearnerOwnTask:async(_:unknown,path:{projectId:string},body:unknown)=>
  write("learner-task-create",path.projectId,null,body),
}));
vi.mock("@/modules/projects/mentor-task-details-service",()=>({
 updateMentorTaskDetails:async(_:unknown,path:{projectId:string;taskId:string},body:unknown)=>
  write("task-edit",path.projectId,path.taskId,body),
}));
vi.mock("@/modules/projects/mentor-task-delete-service",()=>({
 deleteMentorProjectTask:async(_:unknown,pid:string,id:string,body:unknown)=>
  write("task-delete",pid,id,body),
}));
vi.mock("@/modules/projects/lifecycle-service",()=>({
 startProjectSprint:async(_:unknown,pid:string,id:string)=>write("sprint-start",pid,id),
 completeProjectSprint:async(_:unknown,pid:string,id:string)=>write("sprint-complete",pid,id),
 reopenProjectSprint:async(_:unknown,pid:string,id:string)=>write("sprint-reopen",pid,id),
 updateProjectTaskStatus:async(_:unknown,pid:string,id:string,body:unknown)=>
  write("task-status",pid,id,body),
}));
const one={params:Promise.resolve({projectId})};
const sprint={params:Promise.resolve({projectId,sprintId})};
const task={params:Promise.resolve({projectId,taskId})};
const requests=[
 {name:"sprint-create",method:"POST",invoke:(r:Request)=>createSprint(r,one),id:"",readsBody:true},
 {name:"sprint-edit",method:"PATCH",invoke:(r:Request)=>editSprint(r,sprint),id:sprintId,readsBody:true},
 {name:"sprint-delete",method:"DELETE",invoke:(r:Request)=>deleteSprint(r,sprint),id:sprintId,readsBody:true},
 {name:"sprint-start",method:"POST",invoke:(r:Request)=>startSprint(r,sprint),id:sprintId,readsBody:false},
 {name:"sprint-complete",method:"POST",invoke:(r:Request)=>completeSprint(r,sprint),id:sprintId,readsBody:false},
 {name:"sprint-reopen",method:"POST",invoke:(r:Request)=>reopenSprint(r,sprint),id:sprintId,readsBody:false},
 {name:"task-create",method:"POST",invoke:(r:Request)=>createTask(r,one),id:"",readsBody:true},
 {name:"task-edit",method:"PATCH",invoke:(r:Request)=>editTaskDetails(r,task),id:taskId,readsBody:true},
 {name:"task-delete",method:"DELETE",invoke:(r:Request)=>deleteTask(r,task),id:taskId,readsBody:true},
 {name:"task-status",method:"PATCH",invoke:(r:Request)=>transitionTask(r,task),id:taskId,readsBody:true},
];
function request(method:string,body:unknown={}){
 return new Request("https://campus.example/api/projects/"+projectId,{
  method,headers:{"Content-Type":"application/json"},
  body:typeof body==="string"?body:JSON.stringify(body),
 });
}
beforeEach(()=>{
 state.sameOrigin=true;state.authenticated=true;state.allowed=true;state.access="MENTOR";
 state.authCalls=0;state.scopes=0;state.reads=0;state.writes=0;
 state.lastOperation="";state.lastBody=null;state.lastProjectId="";state.lastObjectId="";
});
describe("Sprint and task mutating routes under Mentor account",()=>{
 for(const route of requests){
  it("PROJ-BREAK-MENTOR-339 "+route.name+" rejects hostile origin before auth and writes",async()=>{
   state.sameOrigin=false;
   const response=await route.invoke(request(route.method,{title:"ignored"}));
   expect(response.status).toBe(403);
   expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(state.authCalls+state.scopes+state.writes).toBe(0);
  });
  it("PROJ-BREAK-MENTOR-340 "+route.name+" denies expired session before service invocation",async()=>{
   state.authenticated=false;
   const response=await route.invoke(request(route.method));
   expect(response.status).toBe(403);
   expect(state.authCalls).toBe(1);
   expect(state.writes).toBe(0);
   expect(JSON.stringify(await response.json())).not.toContain("AUTH_REQUIRED");
  });
  it("PROJ-BREAK-MENTOR-341 "+route.name+" passes route IDs to one authorized service call",async()=>{
   // Task status has a distinct strict command schema. Keep the route mock
   // checking a real, valid status transition rather than an editor payload.
   const body=route.name==="task-status"
    ? {expectedUpdatedAt:"2099-01-01T00:00:00.000Z",status:"IN_PROGRESS"}
    : route.name==="sprint-complete"
      ? {note:"Sprint review complete",decisions:[]}
      : {expectedUpdatedAt:"2099-01-01T00:00:00.000Z",title:"Sprint"};
   const response=await route.invoke(request(route.method,body));
   expect(response.status).toBeLessThan(300);
   expect(state.lastOperation).toBe(route.name);
   expect(state.lastProjectId).toBe(projectId);
   expect(state.lastObjectId).toBe(route.id);
   expect(state.writes).toBe(1);
   if(route.readsBody)expect(state.lastBody).toEqual(body);
  });
  it("PROJ-BREAK-MENTOR-342 "+route.name+" handles forbidden service without leaking codes",async()=>{
   state.allowed=false;
   const response=await route.invoke(request(route.method));
   expect(response.status).toBe(403);
   expect(state.writes).toBe(0);
   expect(JSON.stringify(await response.json())).not.toContain("PROJECT_ACCESS_DENIED");
  });
 }
 it("PROJ-BREAK-MENTOR-343 learner task creation has explicit learner-only routing",async()=>{
  state.access="LEARNER";
  const body={title:"Learner task"};
  const response=await createTask(request("POST",body),one);
  expect(response.status).toBe(201);
  expect(state.scopes).toBe(1);
  expect(state.lastOperation).toBe("learner-task-create");
  expect(state.lastBody).toEqual(body);
 });
 it("PROJ-BREAK-MENTOR-344 malformed Sprint/task editor JSON cannot invoke a write",async()=>{
  for(const route of requests.filter(item=>item.readsBody && item.name!=="sprint-delete")){
   const response=await route.invoke(request(route.method,"{broken JSON"));
   const bounded=new Set(["sprint-create","sprint-edit","task-create","task-edit"]);
   expect(response.status).toBe(400);
   if(bounded.has(route.name))
    expect(await response.json()).toMatchObject({error:"INVALID_PROJECT_COMMAND_BODY"});
  }
  expect(state.writes).toBe(0);
 });
});
