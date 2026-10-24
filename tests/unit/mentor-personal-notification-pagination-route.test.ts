import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/mentor/notifications/personal/route";
const state=vi.hoisted(()=>({
 authenticated:true,allowed:true,
 calls:[] as Array<{view:string;beforeCreatedAt?:string;beforeId?:string}>,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  if(!state.authenticated)throw Error("AUTH_REQUIRED");
  return {user:{id:"mentor"}};},
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"ACCESS_DENIED"},{status:403}),
}));
vi.mock("@/modules/activity/mentor-notifications-service",()=>({
 getMentorPersonalInbox:async(_:unknown,query:{
  view:string;beforeCreatedAt?:string;beforeId?:string})=>{
  if(!state.allowed)throw Error("ACCESS_DENIED");
  state.calls.push(query);
  return {query,cursor:{invalid:false},
   page:{
    items:[{notification:{
     id:"notice-1",title:"New review",body:"Please review",
     createdAt:new Date("2026-10-24T09:20:00Z"),readAt:null,
     actionHref:"/mentor/projects/p1?tab=delivery",
    },event:{id:"event-1"}}],
    nextCursor:{beforeCreatedAt:new Date("2026-10-24T09:20:00Z"),
      beforeId:"11111111-1111-4111-8111-111111111111"},
   },
  };
 },
}));
const endpoint="https://test.invalid/api/mentor/notifications/personal";
const call=(query="")=>GET(new Request(endpoint+query));
beforeEach(()=>{state.calls=[];state.authenticated=true;state.allowed=true;});
describe("Mentor older personal notification pages",()=>{
 it("projects only the scoped recipient's safe personal source and continuation",async()=>{
  const response=await call("?view=unread");
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({
    items:[{
     id:"notice-1",source:"PERSONAL",title:"New review",
     description:"Please review",occurredAt:"2026-10-24T09:20:00.000Z",
     actionHref:"/mentor/projects/p1?tab=delivery",read:false,receiptKey:null,
    }],
    nextCursor:{beforeCreatedAt:"2026-10-24T09:20:00.000Z",
      beforeId:"11111111-1111-4111-8111-111111111111"},
  });
 });
 it("rejects malformed cursor and unexpected account selectors before read",async()=>{
  for(const query of ["?beforeId=not-a-uuid","?userId=another",
    "?view=all&view=unread","?view=bogus"]){
   expect((await call(query)).status).toBe(400);
  }
  expect(state.calls).toHaveLength(0);
 });
 it("requires authentication and active persisted Mentor access per page",async()=>{
  state.authenticated=false;
  expect((await call()).status).toBe(403);
  state.authenticated=true;state.allowed=false;
  expect((await call("?view=all")).status).toBe(403);
 });
});
