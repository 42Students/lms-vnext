import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/mentor/attention/later/route";
const state=vi.hoisted(()=>({origin:true,authorized:true,seen:[] as string[]}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.origin}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  if(!state.authorized)throw Error("AUTH_REQUIRED");
  return {user:{id:"mentor"},membership:{id:"active"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"PROJECT_ACCESS_DENIED"},{status:403}),
}));
vi.mock("@/modules/projects/mentor-attention-later-service",()=>({
 markOwnMentorAttentionLater:async(_:unknown,key:string)=>{
  state.seen.push(key);return {hidden:true};
 },
}));
const request=(body:string)=>new Request(
 "https://lms.example.edu/api/mentor/attention/later",{
  method:"POST",headers:{"content-type":"application/json"},body,
});
beforeEach(()=>{state.origin=true;state.authorized=true;state.seen=[];});
describe("Mentor persistent Later HTTP boundary",()=>{
 it("rejects cross-origin before changing any receipt",async()=>{
  state.origin=false;
  expect((await POST(request('{"key":"attention:p:review@v1"}'))).status).toBe(403);
  expect(state.seen).toEqual([]);
 });
 it("rejects malformed or extra tenant/user selectors",async()=>{
  for(const body of ["",'{',"{}",'{"key":"x"}',
   '{"key":"attention:p:review@v1","userId":"other"}',
   "x".repeat(1300)]){
   expect((await POST(request(body))).status).not.toBe(200);
  }
  expect(state.seen).toEqual([]);
 });
 it("records only a source identity under current login",async()=>{
  const key="attention:p:review@v1";
  const response=await POST(request(JSON.stringify({key})));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(state.seen).toEqual([key]);
 });
 it("rejects removed/inactive recipients",async()=>{
  state.authorized=false;
  expect((await POST(request('{"key":"attention:p:review@v1"}'))).status).toBe(403);
  expect(state.seen).toEqual([]);
 });
});
