import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/mentor/notifications/count/route";

const state=vi.hoisted(()=>({
 signedIn:true,projectsEnabled:true,announcementsEnabled:true,
 notices:1,readKeys:new Set<string>(),calls:[] as string[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  if(!state.signedIn)throw Error("AUTH_REQUIRED");
  return {user:{id:"mentor"},membership:{id:"member"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"AUTH_REQUIRED"},{status:401}),
}));
vi.mock("@/modules/activity/mentor-notifications-service",()=>({
 getMentorPersonalInbox:async()=>({unreadCount:3}),
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.projectsEnabled}}),
}));
vi.mock("@/modules/announcements/readiness",()=>({
 announcementsRuntimeEnabled:()=>state.announcementsEnabled,
}));
vi.mock("@/modules/announcements/service",()=>({
 listVisibleAnnouncementsForMembership:async()=>
  Array.from({length:state.notices},(_,index)=>({
   id:"notice-"+index,createdAt:new Date("2026-10-24T00:00:00Z"),
  })),
}));
vi.mock("@/modules/projects/mentor-attention-service",()=>({
 listMyMentorProjectAttention:async()=>[{
   key:"review:sub",projectId:"project-1",
   occurredAt:"2026-10-23T08:00:00Z",
 }],
}));
vi.mock("@/modules/projects/mentor-notification-source-receipts-service",()=>({
 listOwnMentorSourceReceipts:async(_:unknown,keys:string[])=>{
   state.calls=keys;
   return new Set(keys.filter(key=>state.readKeys.has(key)));
 },
}));
beforeEach(()=>{
 state.signedIn=true;state.projectsEnabled=true;state.announcementsEnabled=true;
 state.notices=1;state.readKeys=new Set();state.calls=[];
});
describe("Mentor bell unified unread count",()=>{
 it("adds personal, current project attention and authorized college notice sources",async()=>{
  const response=await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual({
   unreadCount:5,loadedSourceUnread:2,partial:false,
  });
  expect(state.calls).toHaveLength(2);
 });
 it("honors read receipts and disabled optional sources",async()=>{
  state.readKeys=new Set(["attention:project-1:review:sub@2026-10-23T08:00:00Z"]);
  state.announcementsEnabled=false;state.projectsEnabled=false;
  expect((await(await GET()).json()).unreadCount).toBe(3);
  expect(state.calls).toEqual([]);
 });
 it("flags incomplete notice counts rather than presenting false exactness",async()=>{
  state.notices=100;
  expect((await(await GET()).json()).partial).toBe(true);
 });
 it("denies unauthenticated requests",async()=>{
  state.signedIn=false;
  expect((await GET()).status).toBe(401);
 });
});
