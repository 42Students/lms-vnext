import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/projects/[projectId]/activity/seen/route";

const state=vi.hoisted(()=>({
 origin:true,signedIn:true,allowed:true,calls:[] as string[],
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
vi.mock("@/modules/projects/mentor-activity-seen-service",()=>({
 markMentorProjectActivitySeen:async(_:unknown,id:string)=>{
  state.calls.push(id);
  if(!state.allowed)throw Error("PROJECT_ACCESS_DENIED");
  return {lastSeenAt:"2026-10-24T07:00:00.000Z"};
 },
}));
const projectId="11111111-1111-4111-8111-111111111111";
const call=(body="")=>POST(new Request(
 "https://lms.example.edu/api/projects/"+projectId+"/activity/seen",{
 method:"POST",headers:{"content-type":"text/plain"},body,
}),{params:Promise.resolve({projectId})});
beforeEach(()=>{state.origin=true;state.signedIn=true;state.allowed=true;
 state.calls=[];});
describe("Mentor activity seen cursor HTTP endpoint",()=>{
 it("rejects cross-origin requests before any write",async()=>{
  state.origin=false;
  expect((await call()).status).toBe(403);
  expect(state.calls).toEqual([]);
 });
 it("forbids timestamps and client-defined tenant scope",async()=>{
  for(const data of ['{"seenAt":"2099-01-01T00:00:00Z"}',
    '{"collegeId":"another"}',"X".repeat(300)]){
   expect((await call(data)).status).not.toBe(200);
  }
  expect(state.calls).toEqual([]);
 });
 it("writes only the current authenticated Mentor project marker",async()=>{
  const response=await call();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual({
   lastSeenAt:"2026-10-24T07:00:00.000Z"});
  expect(state.calls).toEqual([projectId]);
 });
 it("rejects stale membership or inaccessible project",async()=>{
  state.signedIn=false;
  expect((await call()).status).toBe(403);
  expect(state.calls).toEqual([]);
  state.signedIn=true;state.allowed=false;
  expect((await call()).status).toBe(403);
 });
});
