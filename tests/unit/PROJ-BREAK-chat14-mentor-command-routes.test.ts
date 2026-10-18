import {beforeEach,describe,expect,it,vi} from "vitest";
import {PATCH as overview} from "@/app/api/projects/[projectId]/mentor-overview/route";
import {POST as lock} from "@/app/api/projects/[projectId]/submissions/[submissionId]/mentor-lock/route";
const state=vi.hoisted(()=>({sameOrigin:true,read:0,locked:0}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.sameOrigin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/projects/mentor-overview-edit-service",()=>({
 updateMentorProjectOverview:async(_:unknown,__:string,raw:unknown)=>{
  state.read++;return {id:"project",input:raw};
 },
}));
vi.mock("@/modules/projects/mentor-delivery-lock-service",()=>({
 lockMentorFinalDelivery:async(_:unknown,__:string,___:string,raw:unknown)=>{
  state.locked++;return {id:"submission",input:raw};
 },
}));
const context={
 overview:{params:Promise.resolve({projectId:"11111111-1111-4111-8111-111111111111"})},
 lock:{params:Promise.resolve({projectId:"11111111-1111-4111-8111-111111111111",
  submissionId:"22222222-2222-4222-8222-222222222222"})},
};
const routes=[
 {name:"overview",path:"/api/projects/p/mentor-overview",fn:(r:Request)=>overview(r,context.overview)},
 {name:"lock",path:"/api/projects/p/submissions/s/mentor-lock",fn:(r:Request)=>lock(r,context.lock)},
];
const request=(route:{path:string},body:string,headers:Record<string,string>={"content-type":"application/json"})=>
 new Request("https://example.edu"+route.path,{method:"POST",headers,body});
beforeEach(()=>{state.sameOrigin=true;state.read=0;state.locked=0;});

describe("PROJ-BREAK-MENTOR-103..108 bounded write route and hostile retry proof",()=>{
 it("PROJ-BREAK-MENTOR-103 denies cross-origin before consuming even invalid body",async()=>{
  state.sameOrigin=false;
  for(const route of routes){
   const res=await route.fn(request(route,"{not-json"));
   expect(res.status).toBe(403);
   expect((await res.json()).error).toBe("INVALID_ORIGIN");
  }
  expect(state.read+state.locked).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-104 rejects 128KiB+ command bodies before service and preserves helpful copy",async()=>{
  for(const route of routes){
   const res=await route.fn(request(route,JSON.stringify({payload:"a".repeat(131073)})));
   expect(res.status).toBe(413);
   expect((await res.json()).message).toContain("Shorten the notes and retry");
  }
  expect(state.read+state.locked).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-105 prevents unsupported content type without touching project",async()=>{
  for(const route of routes){
   const res=await route.fn(request(route,'{"x":1}',{"content-type":"text/plain"}));
   expect(res.status).toBe(415);
   expect((await res.json()).message).toContain("sent as JSON");
  }
  expect(state.read+state.locked).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-106 malformed/truncated JSON maps to friendly 400",async()=>{
  for(const route of routes){
   const res=await route.fn(request(route,'{"incomplete":'));
   expect(res.status).toBe(400);
   expect((await res.json()).message).toContain("Check the form and retry");
  }
  expect(state.read+state.locked).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-107 valid JSON dispatches exactly once to the scoped service",async()=>{
  for(const route of routes){
   const res=await route.fn(request(route,'{"confirmed":true,"expectedUpdatedAt":"2026-10-18T10:00:00Z"}'));
   expect(res.status).toBe(200);
   const json=await res.json();
   expect(json).toHaveProperty(route.name==="lock"?"submission":"project");
  }
  expect(state.read).toBe(1);
  expect(state.locked).toBe(1);
 });
});
