import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/mentor/notifications/preview/route";
const state=vi.hoisted(()=>({
 signedIn:true,projects:true,announcements:true,
 readKeys:new Set<string>(),
}));
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
 getMentorPersonalInbox:async()=>({
  page:{nextCursor:null,items:[{notification:{
   id:"11111111-1111-4111-8111-111111111111",title:"Own personal item",
   body:"Team submitted evidence",createdAt:new Date("2026-10-24T08:00:00Z"),
   actionHref:"/mentor/projects",readAt:null,
  }}]},
 }),
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.projects}}),
}));
vi.mock("@/modules/announcements/readiness",()=>({
 announcementsRuntimeEnabled:()=>state.announcements,
}));
vi.mock("@/modules/projects/mentor-attention-service",()=>({
 listMyMentorProjectAttention:async()=>[{
  key:"review:sub",projectId:"p",title:"Submission review",
  description:"Review",occurredAt:"2026-10-24T07:00:00Z",
  href:"/mentor/projects/p?tab=delivery",revision:"v1",
 }],
}));
vi.mock("@/modules/announcements/service",()=>({
 listVisibleAnnouncementsForMembership:async()=>[{
  id:"22222222-2222-4222-8222-222222222222",title:"College update",
  message:"Workshop",createdAt:new Date("2026-10-24T06:00:00Z"),
  version:1,
 }],
}));
vi.mock("@/modules/projects/mentor-notification-source-receipts-service",()=>({
 listOwnMentorSourceReceipts:async(_:unknown,keys:string[])=>
  new Set(keys.filter(key=>state.readKeys.has(key))),
}));
beforeEach(()=>{
 state.signedIn=true;state.projects=true;state.announcements=true;
 state.readKeys=new Set();
});
describe("Mentor merged bell preview API",()=>{
 it("returns no-store newest-first personal, attention and college records",async()=>{
  const response=await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const data=await response.json() as {items:Array<{
    title:string;source:string;read:boolean}>};
  expect(data.items.map(row=>row.source))
   .toEqual(["PERSONAL","ATTENTION","ANNOUNCEMENT"]);
  expect(data.items.every(row=>row.read===false)).toBe(true);
 });
 it("does not include disabled optional project or college sources",async()=>{
  state.projects=false;state.announcements=false;
  const result=await(await GET()).json() as {items:Array<{source:string}>};
  expect(result.items.map(item=>item.source)).toEqual(["PERSONAL"]);
 });
 it("denies removed or unauthenticated Mentor identity",async()=>{
  state.signedIn=false;
  expect((await GET()).status).toBe(403);
 });
});
