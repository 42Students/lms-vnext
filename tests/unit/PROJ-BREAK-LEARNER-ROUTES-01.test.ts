import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),error:vi.fn(),
 move:vi.fn(),progress:vi.fn(),remove:vi.fn(),pull:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/projects/learner-task-status-service",()=>({moveOwnLearnerProjectTask:state.move}));
vi.mock("@/modules/projects/learner-task-progress-service",()=>({updateLearnerProjectTaskProgress:state.progress}));
vi.mock("@/modules/projects/learner-own-task-service",()=>({deleteLearnerOwnTask:state.remove}));
vi.mock("@/modules/projects/learner-backlog-pull-service",()=>({pullOwnBacklogTask:state.pull}));
import {POST as move} from "@/app/api/projects/[projectId]/tasks/[taskId]/learner-status/route";
import {PATCH as progress} from "@/app/api/projects/[projectId]/tasks/[taskId]/learner-progress/route";
import {DELETE as remove} from "@/app/api/projects/[projectId]/tasks/[taskId]/learner-own/route";
import {PATCH as pull} from "@/app/api/projects/[projectId]/backlog/pull/route";

const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const actor={user:{id:"persisted-user"},membership:{id:"persisted-membership"}};
const version="2026-10-18T04:35:00.000Z";
const ctx={params:Promise.resolve({projectId,taskId})};
function request(method:string,input:unknown={}) {
 return new Request("https://college.invalid/api/projects",{
  method,headers:{"content-type":"application/json"},
  ...(method==="DELETE"?{}:{body:JSON.stringify(input)}),
 });
}
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.origin.mockReturnValue(true);
 state.context.mockResolvedValue(actor);
 state.move.mockResolvedValue({id:taskId,status:"IN_PROGRESS"});
 state.progress.mockResolvedValue({id:taskId,status:"IN_PROGRESS"});
 state.remove.mockResolvedValue({deleted:true});
 state.pull.mockResolvedValue({id:taskId,sprintId:"sprint"});
 state.error.mockImplementation(()=>NextResponse.json({error:"SAFE_FAILURE",
  message:"Please refresh and retry."},{status:409}));
});
describe("PROJ-BREAK-LEARNER-ROUTES-01 actual Next.js Learner task route actions",()=>{
 const handlers=[
  {name:"task status",method:"POST",handler:move,service:state.move},
  {name:"task progress",method:"PATCH",handler:progress,service:state.progress},
  {name:"own-task deletion",method:"DELETE",handler:remove,service:state.remove},
  {name:"backlog pull",method:"PATCH",handler:pull,service:state.pull},
 ] as const;
 for(const spec of handlers){
  it(`denies forged cross-origin ${spec.name} before decoding caller identity or invoking service`,async()=>{
   state.origin.mockReturnValueOnce(false);
   const response=await spec.handler(request(spec.method,{collegeId:"other-college"}),ctx);
   expect(response.status).toBe(403);
   expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(state.context).not.toHaveBeenCalled();
   expect(spec.service).not.toHaveBeenCalled();
  });
  it(`delegates valid ${spec.name} to persisted actor rather than spoofable body userId`,async()=>{
   const body={action:"STATUS",status:"IN_PROGRESS",expectedUpdatedAt:version,userId:"attacker",collegeId:"foreign"};
   const response=await spec.handler(request(spec.method,body),ctx);
   expect(response.status).toBe(200);
   expect(state.context).toHaveBeenCalledTimes(1);
   expect(spec.service).toHaveBeenCalledTimes(1);
   expect(spec.service.mock.calls[0][0]).toBe(actor);
   expect(JSON.stringify(await response.json())).not.toContain("attacker");
   if(spec.service===state.move){
    expect(state.move).toHaveBeenCalledWith(actor,projectId,taskId,body);
   }else if(spec.service===state.progress){
    expect(state.progress).toHaveBeenCalledWith(actor,{projectId,taskId},body);
   }else if(spec.service===state.remove){
    expect(state.remove).toHaveBeenCalledWith(actor,{projectId},taskId);
   }else if(spec.service===state.pull){
    expect(state.pull).toHaveBeenCalledWith(actor,projectId,body);
   }
  });
  it(`maps simulated expired/stale/cross-tenant ${spec.name} failure to friendly response`,async()=>{
   spec.service.mockRejectedValueOnce(new Error("db-internal password"));
   const response=await spec.handler(request(spec.method,{taskId}),ctx);
   expect(response.status).toBe(409);
   const body=await response.json();
   expect(body.message).toContain("Refresh");
   expect(JSON.stringify(body)).not.toMatch(/password|db-internal/i);
   expect(state.error).toHaveBeenCalledTimes(1);
  });
 }
});
