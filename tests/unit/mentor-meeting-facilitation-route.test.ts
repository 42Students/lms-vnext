import {beforeEach,describe,expect,it,vi} from "vitest";
import {PATCH} from
 "@/app/api/projects/[projectId]/meetings/[meetingId]/facilitation/route";
const data=vi.hoisted(()=>({
 origin:true,signedIn:true,allowed:true,calls:[] as Array<{
  path:unknown;input:unknown}>,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>data.origin}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  if(!data.signedIn)throw Error("AUTH_REQUIRED");
  return {user:{id:"mentor"},membership:{id:"member"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"ACCESS_DENIED"},{status:403}),
}));
vi.mock("@/modules/projects/mentor-meeting-notes-service",()=>({
 updateMentorMeetingFacilitation:async(_:unknown,path:unknown,input:unknown)=>{
  if(!data.allowed)throw Error("PROJECT_ACCESS_DENIED");
  data.calls.push({path,input});
  return {id:"meeting",updatedAt:new Date("2026-10-24T00:00:00Z")};
 },
}));
const path={
 projectId:"11111111-1111-4111-8111-111111111111",
 meetingId:"22222222-2222-4222-8222-222222222222",
};
const payload={facilitation:{
 attendees:[{name:"Maya",membershipId:null,attended:false}],
 actionItemRows:[{text:"Ship notes",owner:"Maya",dueAt:null,complete:true}],
 retroActions:[],notes:"Resolved",actionItems:"",
 wentWell:"Solid demo",retroDidntGoWell:"Late test run",improve:"Earlier QA",
 nextTime:"Run test suite",followUpAt:null,followUpStatus:"OPEN",followUpNotes:"",
},expectedUpdatedAt:"2026-10-24T08:00:00Z",confirmed:true};
const request=()=>new Request("https://lms.example.edu/api/projects/x/meetings/y/facilitation",{
 method:"PATCH",headers:{"content-type":"application/json"},
 body:JSON.stringify(payload),
});
const call=()=>PATCH(request(),{params:Promise.resolve(path)});
beforeEach(()=>{data.origin=true;data.signedIn=true;data.allowed=true;data.calls=[];});
describe("Completed Mentor meeting structured notes endpoint",()=>{
 it("blocks cross-origin before any write",async()=>{
  data.origin=false;expect((await call()).status).toBe(403);
  expect(data.calls).toEqual([]);
 });
 it("passes exact authenticated project/meeting path and structured data",async()=>{
  const reply=await call();
  expect(reply.status).toBe(200);
  expect(reply.headers.get("cache-control")).toBe("private, no-store");
  expect(data.calls).toEqual([{path,input:payload}]);
 });
 it("refuses missing login and stale or revoked project scope",async()=>{
  data.signedIn=false;expect((await call()).status).toBe(403);
  data.signedIn=true;data.allowed=false;
  expect((await call()).status).toBe(403);
  expect(data.calls).toEqual([]);
 });
});
