import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/notifications/stream/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { verifyIdentitySessionCookie } from "@/auth/session";
import { resolveRequestContext } from "@/modules/identity/context-service";
import { getDb } from "@/db/client";
import {
  canSubscribeToClassNotificationStream,
  notificationStreamScopeUnchanged,
} from "@/modules/activity/notification-stream-authorization";
import { listOwnNotifications, countOwnUnreadNotifications } from "@/modules/activity/notification-service";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext:vi.fn() }));
vi.mock("next/headers", () => ({
  cookies:vi.fn(async () => ({get: (key:string) =>
    key==="lms_session"?{value:"valid-opaque-fixture-session"}:undefined})),
}));
vi.mock("@/auth/session", () => ({
  SESSION_COOKIE_NAME:"lms_session",
  verifyIdentitySessionCookie:vi.fn(),
}));
vi.mock("@/modules/identity/context-service", () => ({ resolveRequestContext:vi.fn() }));
vi.mock("@/db/client", () => ({ getDb:vi.fn() }));
vi.mock("@/modules/activity/notification-stream-authorization", () => ({
  canSubscribeToClassNotificationStream:vi.fn(),
  notificationStreamScopeUnchanged:vi.fn(),
}));
vi.mock("@/modules/activity/notification-service", () => ({
  listOwnNotifications:vi.fn(),
  countOwnUnreadNotifications:vi.fn(),
}));

const CLASS_A = "11111111-1111-4111-8111-111111111111";
const context:RequestContext = {
  user:{id:"22222222-2222-4222-8222-222222222222",
    identityUid:"sse-test-user",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"33333333-3333-4333-8333-333333333333",
    collegeId:"44444444-4444-4444-8444-444444444444",
    organizationId:"55555555-5555-4555-8555-555555555555",
    status:"ACTIVE",roles:["LEARNER"]},
  adminScope:null,recruiter:null,
};
const openControllers:AbortController[] = [];
beforeEach(()=>{
  vi.clearAllMocks();
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context);
  vi.mocked(verifyIdentitySessionCookie).mockResolvedValue({
    uid:"sse-test-user",sessionId:"77777777-7777-4777-8777-777777777777",
  });
  vi.mocked(resolveRequestContext).mockResolvedValue(context);
  vi.mocked(notificationStreamScopeUnchanged).mockReturnValue(true);
  vi.mocked(listOwnNotifications).mockResolvedValue([]);
  vi.mocked(countOwnUnreadNotifications).mockResolvedValue(0);
});
afterEach(()=>{
  for(const controller of openControllers) controller.abort();
  openControllers.length=0;
});
function request(query=""){
 const controller=new AbortController();
 openControllers.push(controller);
 return new Request("https://lms.example/api/notifications/stream"+query,
   {signal:controller.signal});
}
describe("notifications SSE class probing and live authority",()=>{
 it.each([
  "?classId="+CLASS_A+"&classId="+CLASS_A,
  "?classId=",
  "?classId=invalid",
  "?courseId="+CLASS_A,
  "?debug=true",
 ])("rejects ambiguous or unrecognized selector %s before loading identity",async query=>{
   const result=await GET(request(query));
   expect(result.status).toBe(400);
   // route() authenticates once (401 before the handler); the handler rejects the selector before any further identity or DB work.
   expect(getCurrentRequestContext).toHaveBeenCalledTimes(1);
   expect(resolveRequestContext).not.toHaveBeenCalled();
   expect(getDb).not.toHaveBeenCalled();
 });
 it("never accepts bearer-token query strings",async()=>{
   const result=await GET(request("?token=forbidden"));
   expect(result.status).toBe(400);
   expect(await result.json()).toMatchObject({error:"BEARER_QUERY_FORBIDDEN"});
   expect(getCurrentRequestContext).toHaveBeenCalledTimes(1);
   expect(getDb).not.toHaveBeenCalled();
 });
 it("denies unassigned same-college class ID before querying class size",async()=>{
   vi.mocked(canSubscribeToClassNotificationStream).mockResolvedValue(false);
   const result=await GET(request("?classId="+CLASS_A));
   expect(result.status).toBe(404);
   expect(await result.json()).toMatchObject({error:"NOT_FOUND"});
   expect(getDb).not.toHaveBeenCalled();
   expect(listOwnNotifications).not.toHaveBeenCalled();
 });
 it("re-resolves persisted role and tenant before reading a live stream",async()=>{
   const response=await GET(request());
   expect(response.status).toBe(200);
   expect(response.headers.get("cache-control")).toContain("no-cache");
   const reader=response.body!.getReader();
   await reader.read();
   await vi.waitFor(()=>expect(verifyIdentitySessionCookie).toHaveBeenCalledTimes(1));
   await vi.waitFor(()=>expect(resolveRequestContext).toHaveBeenCalledTimes(1));
   await vi.waitFor(()=>expect(listOwnNotifications).toHaveBeenCalledTimes(1));
   expect(countOwnUnreadNotifications).toHaveBeenCalledWith(context);
   await reader.cancel();
 });
 it("closes a stream when device token was revoked before reading private receipts",async()=>{
   vi.mocked(verifyIdentitySessionCookie).mockRejectedValue(new Error("SESSION_REVOKED"));
   const response=await GET(request());
   expect(response.status).toBe(200);
   const reader=response.body!.getReader();
   await reader.read();
   await vi.waitFor(()=>expect(verifyIdentitySessionCookie).toHaveBeenCalledTimes(1));
   expect(resolveRequestContext).not.toHaveBeenCalled();
   expect(listOwnNotifications).not.toHaveBeenCalled();
   await reader.cancel();
 });
 it("closes a stream when token subject differs from the selected actor",async()=>{
   vi.mocked(verifyIdentitySessionCookie).mockResolvedValue({
     uid:"different-user",sessionId:"77777777-7777-4777-8777-777777777777",
   });
   const response=await GET(request());
   expect(response.status).toBe(200);
   const reader=response.body!.getReader();
   await reader.read();
   await vi.waitFor(()=>expect(verifyIdentitySessionCookie).toHaveBeenCalledTimes(1));
   expect(resolveRequestContext).not.toHaveBeenCalled();
   expect(listOwnNotifications).not.toHaveBeenCalled();
   await reader.cancel();
 });
 it("closes a stream on revoked scope without reading private receipts",async()=>{
   vi.mocked(notificationStreamScopeUnchanged).mockReturnValue(false);
   const response=await GET(request());
   expect(response.status).toBe(200);
   const reader=response.body!.getReader();
   await reader.read();
   await vi.waitFor(()=>expect(resolveRequestContext).toHaveBeenCalledTimes(1));
   expect(listOwnNotifications).not.toHaveBeenCalled();
   expect(countOwnUnreadNotifications).not.toHaveBeenCalled();
   await reader.cancel();
 });
});
