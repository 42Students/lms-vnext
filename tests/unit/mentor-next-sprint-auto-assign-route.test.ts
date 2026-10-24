import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/projects/[projectId]/tasks/auto-assign-next/route";
const state=vi.hoisted(()=>({
 origin:true,signedIn:true,mutations:[] as Array<{projectId:string;input:unknown}>,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.origin}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  if(!state.signedIn)throw Error("AUTH_REQUIRED");
  return {user:{id:"mentor"},membership:{id:"member"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"PROJECT_ACCESS_DENIED"},{status:403}),
}));
vi.mock("@/modules/projects/mentor-command-body",()=>({
 MentorProjectCommandBodyError:class MentorProjectCommandBodyError extends Error{},
 mentorProjectBodyFailureMessage:()=>"Invalid request body",
 readMentorProjectCommandBody:async(request:Request)=>request.json(),
}));
vi.mock("@/modules/projects/mentor-auto-assign-service",()=>({
 autoAssignMentorNextSprint:async(_:unknown,projectId:string,input:unknown)=>{
  state.mutations.push({projectId,input});
  return {sprintId:"next",assigned:2,unassignedRemaining:0};
 },
}));
const projectId="11111111-1111-4111-8111-111111111111";
const handler=(body='{"sprintId":"next","expectedSprintUpdatedAt":"2026-10-24T10:00:00Z"}')=>
 POST(new Request("https://lms.example.edu/api/projects/"+projectId+"/tasks/auto-assign-next",{
  method:"POST",headers:{"content-type":"application/json"},body,
 }),{params:Promise.resolve({projectId})});
beforeEach(()=>{state.origin=true;state.signedIn=true;state.mutations=[];});
describe("Mentor scoped next-sprint auto-assign route",()=>{
 it("denies cross-origin before reading identity or task data",async()=>{
  state.origin=false;
  expect((await handler()).status).toBe(403);
  expect(state.mutations).toEqual([]);
 });
 it("delegates only the supplied parent project and server-verifiable sprint token",async()=>{
  const response=await handler();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(state.mutations).toEqual([{projectId,
    input:{sprintId:"next",expectedSprintUpdatedAt:"2026-10-24T10:00:00Z"}}]);
 });
 it("denies unauthenticated callers",async()=>{
  state.signedIn=false;
  expect((await handler()).status).toBe(403);
  expect(state.mutations).toEqual([]);
 });
});
