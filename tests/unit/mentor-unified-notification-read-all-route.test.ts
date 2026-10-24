import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/mentor/notifications/unified-read-all/route";

const state=vi.hoisted(()=>({
 origin:true,signedIn:true,sourceFailure:false,calls:0,
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
 apiErrorResponse:()=>Response.json({error:"ACCESS_DENIED"},{status:403}),
}));
vi.mock("@/modules/projects/mentor-unified-notification-read-all-service",()=>({
 markAllMentorUnifiedNotificationsRead:async()=>{
  state.calls++;
  if(state.sourceFailure)throw Error("PARTIAL_SCAN");
  return {markedPersonal:2,markedSources:3,examinedSources:3,
    completeForCurrentVisibleSources:true};
 },
}));
const request=(body="")=>new Request(
 "https://lms.example.edu/api/mentor/notifications/unified-read-all",{
 method:"POST",headers:{"content-type":"application/json"},body,
});
beforeEach(()=>{state.origin=true;state.signedIn=true;state.sourceFailure=false;
 state.calls=0;});
describe("Atomic Mentor all-source read endpoint",()=>{
 it("rejects cross-origin before reading actor or mutating",async()=>{
  state.origin=false;
  const response=await POST(request());
  expect(response.status).toBe(403);
  expect(state.calls).toBe(0);
 });
 it("accepts only an empty request and no client tenant selectors",async()=>{
  for(const body of ["{","{\\\"collegeId\\\":\\\"forged\\\"}","x".repeat(257)]){
   const response=await POST(request(body));
   expect(response.status).not.toBe(200);
  }
  expect(state.calls).toBe(0);
 });
 it("returns transactional receipts and private cache policy",async()=>{
  const response=await POST(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toMatchObject({
   markedPersonal:2,markedSources:3,completeForCurrentVisibleSources:true});
  expect(state.calls).toBe(1);
 });
 it("cannot claim success after authorization or source failure",async()=>{
  state.signedIn=false;
  expect((await POST(request())).status).toBe(403);
  expect(state.calls).toBe(0);
  state.signedIn=true;state.sourceFailure=true;
  expect((await POST(request())).status).toBe(403);
 });
});
