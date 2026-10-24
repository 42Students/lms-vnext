import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/mentor/notifications/source-read/route";

const state=vi.hoisted(()=>({
 origin:true,signedIn:true,allowed:true,
 calls:[] as string[],
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
 apiErrorResponse:()=>Response.json({error:"NOTIFICATION_NOT_FOUND"},{status:404}),
}));
vi.mock("@/modules/projects/mentor-notification-source-receipts-service",()=>({
 markOwnMentorSourceRead:async(_:unknown,key:string)=>{
  state.calls.push(key);
  if(!state.allowed)throw Error("NOTIFICATION_NOT_FOUND");
  return {markedRead:true};
 },
}));
const make=(body:string,method="POST")=>new Request(
 "https://lms.example.edu/api/mentor/notifications/source-read",{
  method,headers:{"content-type":"application/json"},body,
 });
beforeEach(()=>{state.origin=true;state.signedIn=true;state.allowed=true;
  state.calls=[];});
describe("Mentor source read acknowledgment HTTP boundary",()=>{
 it("rejects cross-origin requests before identity or storage",async()=>{
  state.origin=false;
  expect((await POST(make('{"key":"attention:project:task"}'))).status).toBe(403);
  expect(state.calls).toEqual([]);
 });
 it("rejects malformed keys, extra scope and oversized payloads",async()=>{
  for(const body of ["not-json","{}",'{"key":"short"}',
     '{"key":"attention:project:task","userId":"someone-else"}',
     '{"key":"'+("x".repeat(330))+'"}']){
    const response=await POST(make(body));
    expect(response.status,body.slice(0,40)).not.toBe(200);
  }
  expect(state.calls).toEqual([]);
 });
 it("requires current authentication and source authorization",async()=>{
  state.signedIn=false;
  expect((await POST(make('{"key":"attention:project:task"}'))).status).toBe(404);
  state.signedIn=true;state.allowed=false;
  expect((await POST(make('{"key":"attention:project:task"}'))).status).toBe(404);
 });
 it("accepts a valid scoped, idempotent read action",async()=>{
  const key="attention:project:task";
  const response=await POST(make(JSON.stringify({key})));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual({markedRead:true});
  expect(state.calls).toEqual([key]);
 });
});
