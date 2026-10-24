import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/mentor/notifications/announcements/route";
const state=vi.hoisted(()=>({signedIn:true,persisted:true,enabled:true,
  pages:0,lastCursor:null as unknown,read:new Set<string>()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  if(!state.signedIn)throw Error("AUTH_REQUIRED");
  return {user:{id:"mentor"},membership:{id:"member"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"ACCESS_DENIED"},{status:403}),
}));
vi.mock("@/modules/activity/mentor-notifications-service",()=>({
 requirePersistedMentorInboxMembership:async()=>{
  if(!state.persisted)throw Error("NOT_MENTOR");
  return {collegeId:"college-1"};
 },
}));
vi.mock("@/modules/announcements/readiness",()=>({
 announcementsRuntimeEnabled:()=>state.enabled,
}));
vi.mock("@/modules/announcements/service",()=>({
 listVisibleAnnouncementsForMembershipPage:async(
   _:unknown,__:Date,cursor:unknown)=>{
   state.pages++;state.lastCursor=cursor;
   return {items:[{
     id:"notice-2",title:"New semester",message:"Important",
     createdAt:new Date("2026-10-22T00:00:00Z"),version:2,
   }],nextCursor:null};
 },
}));
vi.mock("@/modules/projects/mentor-notification-source-receipts-service",()=>({
 listOwnMentorSourceReceipts:async(_:unknown,keys:string[])=>
   new Set(keys.filter(key=>state.read.has(key))),
}));
const request=(q:string)=>new Request(
 "https://lms.example.edu/api/mentor/notifications/announcements"+q);
beforeEach(()=>{state.signedIn=true;state.persisted=true;state.enabled=true;
 state.pages=0;state.lastCursor=null;state.read=new Set();});
const query="?beforePinned=0&beforeCreatedAt=2026-10-23T00%3A00%3A00Z"+
  "&beforeId=11111111-1111-4111-8111-111111111111";
describe("Mentor verified older college notices cursor",()=>{
 it("rejects malformed and tenant-injecting parameters before querying",async()=>{
  for(const bad of ["","?beforePinned=1","?beforePinned=2"+
    "&beforeCreatedAt=2026-10-23T00:00:00Z&beforeId=invalid",
    query+"&collegeId=other"]){
    expect((await GET(request(bad))).status,bad).not.toBe(200);
  }
  expect(state.pages).toBe(0);
 });
 it("returns only authorized notice details and persisted read state",async()=>{
  const response=await GET(request(query));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect((await response.json()).items).toMatchObject([
   {id:"notice-2",read:false,source:"ANNOUNCEMENT",
     title:"New semester"},
  ]);
  expect(state.pages).toBe(1);
  expect(state.lastCursor).toMatchObject({
   isPinned:false,id:"11111111-1111-4111-8111-111111111111",
  });
 });
 it("does not load notices for removed mentors or disabled rollout",async()=>{
  state.persisted=false;
  expect((await GET(request(query))).status).toBe(403);
  state.persisted=true;state.enabled=false;
  expect((await GET(request(query))).status).toBe(503);
  expect(state.pages).toBe(0);
 });
});
