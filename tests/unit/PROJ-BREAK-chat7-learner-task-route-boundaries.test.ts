import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),deleteOwn:vi.fn(),updateProgress:vi.fn(),
 moveOwn:vi.fn(),mapError:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:(error:unknown)=>{
 state.mapError(error);
 return new Response(JSON.stringify({error:"Unable to update this project."}),
  {status:400,headers:{"Content-Type":"application/json"}});
}}));
vi.mock("@/modules/projects/learner-own-task-service",()=>({deleteLearnerOwnTask:state.deleteOwn}));
vi.mock("@/modules/projects/learner-task-progress-service",()=>({updateLearnerProjectTaskProgress:state.updateProgress}));
vi.mock("@/modules/projects/learner-task-status-service",()=>({moveOwnLearnerProjectTask:state.moveOwn}));

import {DELETE as deleteOwnRoute} from "@/app/api/projects/[projectId]/tasks/[taskId]/learner-own/route";
import {PATCH as progressRoute} from "@/app/api/projects/[projectId]/tasks/[taskId]/learner-progress/route";
import {POST as statusRoute} from "@/app/api/projects/[projectId]/tasks/[taskId]/learner-status/route";

const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const context={user:{id:"33333333-3333-4333-8333-333333333333"}};
const params={params:Promise.resolve({projectId,taskId})};
const endpoint="https://campus.invalid/api/projects/"+projectId+"/tasks/"+taskId+"/";
const request=(method:"POST"|"PATCH"|"DELETE",suffix:string,body?:unknown)=>
 new Request(endpoint+suffix,{method,headers:{"Content-Type":"application/json"},
  ...(body===undefined?{}:{body:JSON.stringify(body)})});

beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.origin.mockReturnValue(true);
 state.context.mockResolvedValue(context);
 state.deleteOwn.mockResolvedValue({deleted:true});
 state.updateProgress.mockResolvedValue({id:taskId});
 state.moveOwn.mockResolvedValue({id:taskId,status:"IN_PROGRESS"});
});

describe("IIT Dharwad Projects learner role journey route boundaries",()=>{
 it("PROJ-BREAK-LEARNER-95 foreign origin cannot delete a learner task or call service",async()=>{
  state.origin.mockReturnValue(false);
  const response=await deleteOwnRoute(request("DELETE","learner-own"),params);
  expect(response.status).toBe(403);
  expect(state.context).not.toHaveBeenCalled();
  expect(state.deleteOwn).not.toHaveBeenCalled();
 });
 it("PROJ-BREAK-LEARNER-96 foreign origin cannot mutate progress or call service",async()=>{
  state.origin.mockReturnValue(false);
  const response=await progressRoute(request("PATCH","learner-progress",{}),params);
  expect(response.status).toBe(403);
  expect(state.context).not.toHaveBeenCalled();
  expect(state.updateProgress).not.toHaveBeenCalled();
 });
 it("PROJ-BREAK-LEARNER-97 foreign origin cannot move task status or call service",async()=>{
  state.origin.mockReturnValue(false);
  const response=await statusRoute(request("POST","learner-status",{}),params);
  expect(response.status).toBe(403);
  expect(state.context).not.toHaveBeenCalled();
  expect(state.moveOwn).not.toHaveBeenCalled();
 });
 it("PROJ-BREAK-LEARNER-98 own-delete only forwards server actor and exact scoped task",async()=>{
  const response=await deleteOwnRoute(request("DELETE","learner-own"),params);
  expect(response.status).toBe(200);
  expect(state.deleteOwn).toHaveBeenCalledTimes(1);
  expect(state.deleteOwn).toHaveBeenCalledWith(context,{projectId},taskId);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
 });
 it("PROJ-BREAK-LEARNER-99 own-progress only forwards server actor and path-bound task",async()=>{
  const input={progressPercent:25,expectedUpdatedAt:"2099-01-01T12:00:00.000Z"};
  const response=await progressRoute(request("PATCH","learner-progress",input),params);
  expect(response.status).toBe(200);
  expect(state.updateProgress).toHaveBeenCalledTimes(1);
  expect(state.updateProgress).toHaveBeenCalledWith(context,{projectId,taskId},input);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
 });
 it("PROJ-BREAK-LEARNER-100 own-status only forwards server actor and body to guarded service",async()=>{
  const input={status:"BLOCKED",blockerReason:"Awaiting hardware",expectedUpdatedAt:"2099-01-01T12:00:00.000Z"};
  const response=await statusRoute(request("POST","learner-status",input),params);
  expect(response.status).toBe(200);
  expect(state.moveOwn).toHaveBeenCalledTimes(1);
  expect(state.moveOwn).toHaveBeenCalledWith(context,projectId,taskId,input);
 });
 it("PROJ-BREAK-LEARNER-101 service rejection produces safe response, not raw backend details",async()=>{
  state.moveOwn.mockRejectedValueOnce(new Error("private-db-secret"));
  const response=await statusRoute(request("POST","learner-status",{
   status:"IN_PROGRESS",expectedUpdatedAt:"2099-01-01T12:00:00.000Z",
  }),params);
  expect(response.status).toBe(400);
  expect(await response.text()).not.toContain("private-db-secret");
  expect(state.mapError).toHaveBeenCalledTimes(1);
 });
});
