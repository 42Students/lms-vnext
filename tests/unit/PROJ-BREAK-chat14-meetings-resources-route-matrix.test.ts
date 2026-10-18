import {beforeEach,describe,expect,it,vi} from "vitest";
import {
 GET as meetingsGet,POST as meetingsPost,
} from "@/app/api/projects/[projectId]/meetings/route";
import {PATCH as meetingPatch} from "@/app/api/projects/[projectId]/meetings/[meetingId]/route";
import {POST as meetingTransition} from "@/app/api/projects/[projectId]/meetings/[meetingId]/transition/route";
import {GET as resourcesGet,POST as resourcesPost} from "@/app/api/projects/[projectId]/resources/route";
import {PATCH as resourcePatch,DELETE as resourceDelete}
 from "@/app/api/projects/[projectId]/resources/[resourceId]/route";
import {POST as reorder} from "@/app/api/projects/[projectId]/resources/reorder/route";

const state=vi.hoisted(()=>({
 origin:true,loggedIn:true,allowed:true,reads:0,writes:0,authReads:0,
 lastOperation:"",lastProjectId:"",lastRecordId:"",lastBody:null as unknown,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const resourceId="33333333-3333-4333-8333-333333333333";
const actor={user:{id:"mentor"},membership:{id:"membership",collegeId:"college-a"}};
vi.mock("@/auth/origin",()=>({
 isSameOriginRequest:()=>state.origin,
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  state.authReads++;
  if(!state.loggedIn)throw {code:"AUTH_REQUIRED"};
  return actor;
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({
  error:"This action is unavailable. Check your access or try again.",
 },{status:403}),
}));
function authorize(){
 if(!state.allowed)throw {code:"PROJECT_ACCESS_DENIED"};
}
function write(op:string,pid:string,id:string|null,body:unknown){
 authorize();
 state.writes++;
 state.lastOperation=op;
 state.lastProjectId=pid;
 state.lastRecordId=id??"";
 state.lastBody=body;
 return {id:id??"new-record",projectId:pid,status:"ACTIVE"};
}
vi.mock("@/modules/projects/meeting-service",()=>({
 listProjectMeetings:async(_actor:unknown,pid:string)=>{
  authorize();state.reads++;state.lastProjectId=pid;
  return [{id:meetingId,title:"Meeting"}];
 },
 scheduleProjectMeeting:async(_actor:unknown,pid:string,id:string|null,body:unknown)=>
  write("meeting-schedule",pid,id,body),
 transitionProjectMeeting:async(_actor:unknown,pid:string,id:string,body:unknown)=>
  write("meeting-transition",pid,id,body),
}));
vi.mock("@/modules/projects/resource-service",()=>({
 listProjectResources:async(_actor:unknown,pid:string)=>{
  authorize();state.reads++;state.lastProjectId=pid;
  return [{id:resourceId,title:"Resource"}];
 },
 createProjectResource:async(_actor:unknown,pid:string,body:unknown)=>
  write("resource-create",pid,null,body),
 updateProjectResource:async(_actor:unknown,pid:string,id:string,body:unknown)=>
  write("resource-update",pid,id,body),
 archiveProjectResource:async(_actor:unknown,pid:string,id:string,body:unknown)=>
  write("resource-archive",pid,id,body),
 reorderProjectResources:async(_actor:unknown,pid:string,body:unknown)=>
  write("resource-reorder",pid,null,body),
}));
const params1={params:Promise.resolve({projectId})};
const paramsMeeting={params:Promise.resolve({projectId,meetingId})};
const paramsResource={params:Promise.resolve({projectId,resourceId})};
function req(method:string,body:unknown={title:"Safe title"}):Request{
 return new Request("http://localhost/api/projects/"+projectId,{method,
  ...(method==="GET"?{}:{
   headers:{"Content-Type":"application/json"},
   body:typeof body==="string"?body:JSON.stringify(body),
  }),
 });
}
const mutators=[
 {name:"meeting create",method:"POST",call:(r:Request)=>meetingsPost(r,params1),
  operation:"meeting-schedule",id:""},
 {name:"meeting edit",method:"PATCH",call:(r:Request)=>meetingPatch(r,paramsMeeting),
  operation:"meeting-schedule",id:meetingId},
 {name:"meeting transition",method:"POST",call:(r:Request)=>meetingTransition(r,paramsMeeting),
  operation:"meeting-transition",id:meetingId},
 {name:"resource create",method:"POST",call:(r:Request)=>resourcesPost(r,params1),
  operation:"resource-create",id:""},
 {name:"resource edit",method:"PATCH",call:(r:Request)=>resourcePatch(r,paramsResource),
  operation:"resource-update",id:resourceId},
 {name:"resource archive",method:"DELETE",call:(r:Request)=>resourceDelete(r,paramsResource),
  operation:"resource-archive",id:resourceId},
 {name:"resource reorder",method:"POST",call:(r:Request)=>reorder(r,params1),
  operation:"resource-reorder",id:""},
];
beforeEach(()=>{
 state.origin=true;state.loggedIn=true;state.allowed=true;state.reads=0;
 state.writes=0;state.authReads=0;state.lastOperation="";
 state.lastProjectId="";state.lastRecordId="";state.lastBody=null;
});
describe("Mentor meeting and resource endpoint permission matrix",()=>{
 for(const testCase of mutators){
  it("PROJ-BREAK-MENTOR-331 "+testCase.name+" rejects CSRF before auth and body reads",async()=>{
   state.origin=false;
   const response=await testCase.call(req(testCase.method,{secret:"must never be read"}));
   expect(response.status).toBe(403);
   expect(await response.json()).toMatchObject({error:"INVALID_ORIGIN"});
   expect(state.authReads+state.writes+state.reads).toBe(0);
  });
  it("PROJ-BREAK-MENTOR-332 "+testCase.name+" refuses expired session without writes",async()=>{
   state.loggedIn=false;
   const response=await testCase.call(req(testCase.method));
   expect(response.status).toBe(403);
   expect(state.authReads).toBe(1);
   expect(state.writes).toBe(0);
   expect(JSON.stringify(await response.json())).not.toContain("AUTH_REQUIRED");
  });
  it("PROJ-BREAK-MENTOR-333 "+testCase.name+" denies wrong tenant or project role without side effects",async()=>{
   state.allowed=false;
   const response=await testCase.call(req(testCase.method));
   expect(response.status).toBe(403);
   expect(state.writes).toBe(0);
   expect(JSON.stringify(await response.json())).not.toContain("PROJECT_ACCESS_DENIED");
  });
  it("PROJ-BREAK-MENTOR-334 "+testCase.name+" uses exact route IDs and JSON body",async()=>{
   const body={title:"New value",expectedUpdatedAt:"2099-01-01T00:00:00.000Z"};
   const response=await testCase.call(req(testCase.method,body));
   expect(response.status).toBeLessThan(300);
   expect(state.authReads).toBe(1);
   expect(state.writes).toBe(1);
   expect(state.lastProjectId).toBe(projectId);
   expect(state.lastRecordId).toBe(testCase.id);
   expect(state.lastOperation).toBe(testCase.operation);
   expect(state.lastBody).toEqual(body);
  });
 }
 it("PROJ-BREAK-MENTOR-335 GET resources and meetings are read-only, even after retries",async()=>{
  for(const read of [meetingsGet,resourcesGet]){
   for(let i=0;i<2;i++){
    const response=await read(req("GET"),params1);
    expect(response.status).toBe(200);
    expect((await response.json())).toBeTruthy();
   }
  }
  expect(state.reads).toBe(4);
  expect(state.authReads).toBe(4);
  expect(state.writes).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-336 GET rejects missing account or cross-tenant scope with no write",async()=>{
  state.loggedIn=false;
  for(const read of [meetingsGet,resourcesGet]){
   expect((await read(req("GET"),params1)).status).toBe(403);
  }
  expect(state.reads+state.writes).toBe(0);
  state.loggedIn=true;state.allowed=false;
  for(const read of [meetingsGet,resourcesGet]){
   expect((await read(req("GET"),params1)).status).toBe(403);
  }
  expect(state.reads+state.writes).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-337 malformed JSON never reaches project write service",async()=>{
  for(const item of mutators){
   if(item.name==="resource archive")continue;
   const response=await item.call(req(item.method,"{not valid JSON"));
   expect(response.status).toBe(403);
  }
  expect(state.writes).toBe(0);
 });
});
