import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseFacultyInboxQuery } from "@/modules/courses/faculty-inbox-query-model";

const stubs=vi.hoisted(()=>({
 actor:vi.fn(), personal:vi.fn(), unread:vi.fn(), announcement:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({
 redirect:(url:string)=>{throw new Error("REDIRECT_"+url);},
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:stubs.actor}));
vi.mock("@/modules/activity/notification-service",()=>({
 listOwnNotificationPage:stubs.personal,
 countOwnUnreadNotifications:stubs.unread,
}));
vi.mock("@/modules/announcements/readiness",()=>({announcementsRuntimeEnabled:()=>true}));
vi.mock("@/modules/announcements/service",()=>({
 listVisibleAnnouncementsForMembershipPage:stubs.announcement,
}));
vi.mock("@/components/activity/notification-list",async()=>{
 const {createElement}=await import("react");
 return {NotificationList:({items,emptyText}:{items:{id:string;title:string;actionHref:string|null;source?:string}[];emptyText:string})=>
  createElement("section",{"data-feed":"yes"},
   items.length ? items.map(item=>createElement("p",{
    key:item.id,"data-id":item.id,"data-source":item.source??"PERSONAL",
   },item.title+" → "+(item.actionHref??"no action"))) : emptyText)};
});
vi.mock("@/components/activity/notification-toolbar",async()=>{
 const {createElement}=await import("react");
 return {NotificationToolbar:({unreadCount,selectedCategory,canMarkAll}:{
  unreadCount:number;selectedCategory:string;canMarkAll:boolean;
 })=>createElement("nav",{"data-unread":unreadCount,
    "data-category":selectedCategory,"data-can-mark-all":String(canMarkAll)},
    "Faculty inbox filters")};
});
vi.mock("@/app/(authenticated)/teacher/notifications/faculty-notifications-retry",async()=>{
 const {createElement}=await import("react");
 return {FacultyNotificationsRetry:()=>createElement("button",{type:"button"},"Retry notifications")};
});

import FacultyNotificationsPage from "@/app/(authenticated)/teacher/notifications/page";
import Loading from "@/app/(authenticated)/teacher/notifications/loading";
import ErrorBoundary from "@/app/(authenticated)/teacher/notifications/error";

const collegeId="11111111-1111-4111-8111-111111111111";
const now=new Date("2026-10-30T12:00:00Z");
const actor={
 user:{id:"22222222-2222-4222-8222-222222222222",identityUid:"faculty",platformStatus:"ACTIVE" as const,systemRoles:[]},
 membership:{id:"33333333-3333-4333-8333-333333333333",collegeId,
  organizationId:"44444444-4444-4444-8444-444444444444",
  status:"ACTIVE" as const,roles:["FACULTY" as const]},
};
const notification=(title="Personal update",href:string|null="/teacher/courses")=>({
 notification:{id:"55555555-5555-4555-8555-555555555555",title,body:"Visible body",
  actionHref:href,readAt:null,createdAt:now},
 event:{module:"COURSES",importance:"NORMAL"},
});
const announcement=(id="66666666-6666-4666-8666-666666666666")=>({
 id,title:"College update",message:"Public college notice",
 createdAt:new Date("2026-10-30T13:00:00Z"),receiverType:"COLLEGE",isPinned:false,
});
const page=(params:Record<string,string|string[]|undefined>={})=>
 FacultyNotificationsPage({
  searchParams:Promise.resolve(params as {
   view?:string|string[];tab?:string|string[];
   beforeCreatedAt?:string|string[];beforeId?:string|string[];
   beforeNoticeCreatedAt?:string|string[];beforeNoticeId?:string|string[];
   beforeNoticePinned?:string|string[];
  }),
 });
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.actor.mockResolvedValue(actor);
 stubs.personal.mockResolvedValue({items:[notification()],nextCursor:null});
 stubs.announcement.mockResolvedValue({items:[announcement()],nextCursor:null});
 stubs.unread.mockResolvedValue(1);
});
describe("Faculty Notifications page acceptance",()=>{
 it("combines two separately authorized sources, newest first, with safe Faculty destinations",async()=>{
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("College update");
  expect(html).toContain("Personal update");
  expect(html.indexOf("College update")).toBeLessThan(html.indexOf("Personal update"));
  expect(html).toContain("/teacher/courses");
  expect(html).toContain('data-unread="1"');
  expect(stubs.personal).toHaveBeenCalledWith(actor,expect.objectContaining({collegeId,limit:50}));
  expect(stubs.announcement).toHaveBeenCalledWith(actor,expect.any(Date),undefined);
 });
 it("keeps untracked announcements out of the Unread filter",async()=>{
  const html=renderToStaticMarkup(await page({view:"unread"}));
  expect(html).toContain("Personal update");
  expect(html).not.toContain("College update");
  expect(stubs.personal).toHaveBeenCalledWith(actor,expect.objectContaining({unreadOnly:true,collegeId}));
  expect(stubs.announcement).not.toHaveBeenCalled();
 });
 it("shows college announcements only under the college category, no personal leak",async()=>{
  const html=renderToStaticMarkup(await page({tab:"college"}));
  expect(html).toContain("College update");
  expect(html).not.toContain("Personal update");
  expect(html).toContain('data-category="college"');
  expect(html).toContain('data-can-mark-all="false"');
  expect(stubs.personal).not.toHaveBeenCalled();
 });
 it("fails closed on duplicate or forged cursor selectors and has a recovery action",async()=>{
  for(const raw of [
   {view:["all","unread"]},{collegeId:"forged"},
   {beforeNoticeCreatedAt:"2026-10-30T12:00:00Z"},
   {beforeNoticeCreatedAt:"2026-10-30T12:00:00Z",beforeNoticeId:"not-uuid",beforeNoticePinned:"1"},
   {beforeNoticeCreatedAt:"2026-10-30T12:00:00Z",beforeNoticeId:"55555555-5555-4555-8555-555555555555",beforeNoticePinned:"2"},
  ]){
   const html=renderToStaticMarkup(await page(raw));
   expect(html).toContain("The notification filters or page link are invalid");
   expect(html).not.toContain("Personal update");
   expect(html).not.toContain("College update");
   expect(html).not.toContain("No notifications yet");
  }
  expect(stubs.personal).not.toHaveBeenCalled();
  expect(stubs.announcement).not.toHaveBeenCalled();
 });
 it("paginates older announcements with a strict source-specific cursor",async()=>{
  stubs.announcement.mockResolvedValueOnce({items:[announcement()],nextCursor:{
   id:"66666666-6666-4666-8666-666666666666",
   createdAt:new Date("2026-10-29T12:00:00Z"),isPinned:true,
  }});
  const html=renderToStaticMarkup(await page({tab:"college"}));
  expect(html).toContain("Older announcements");
  expect(html).toContain("beforeNoticeId=66666666-6666-4666-8666-666666666666");
  expect(html).toContain("beforeNoticePinned=1");
  expect(html).toContain("tab=college");
  const parsed=parseFacultyInboxQuery({
   beforeNoticeCreatedAt:"2026-10-29T12:00:00.000Z",
   beforeNoticeId:"66666666-6666-4666-8666-666666666666",
   beforeNoticePinned:"1",
  });
  expect(parsed.invalid).toBe(false);
  expect(parsed.noticeCursor?.isPinned).toBe(true);
  await page({
   tab:"college",
   beforeNoticeCreatedAt:"2026-10-29T12:00:00.000Z",
   beforeNoticeId:"66666666-6666-4666-8666-666666666666",
   beforeNoticePinned:"1",
  });
  expect(stubs.announcement).toHaveBeenLastCalledWith(actor,expect.any(Date),parsed.noticeCursor);
 });
 it("treats a valid exhausted older page as stale pagination, not a brand-new empty inbox",async()=>{
  stubs.personal.mockResolvedValueOnce({items:[],nextCursor:null});
  stubs.announcement.mockResolvedValueOnce({items:[],nextCursor:null});
  const html=renderToStaticMarkup(await page({
   beforeCreatedAt:"2026-10-29T12:00:00.000Z",
   beforeId:"55555555-5555-4555-8555-555555555555",
  }));
  expect(html).toContain("No older notifications on this page");
  expect(html).toContain("View all");
  expect(html).not.toContain("No notifications yet");
 });
 it("preserves announcements if personal data fails, and personal data if announcements fail",async()=>{
  stubs.personal.mockRejectedValueOnce(new Error("private backend exception"));
  const first=renderToStaticMarkup(await page());
  expect(first).toContain("College update");
  expect(first).toContain("Retry notifications");
  expect(first).not.toContain("private backend exception");
  stubs.announcement.mockRejectedValueOnce(new Error("secret announcement failure"));
  const second=renderToStaticMarkup(await page());
  expect(second).toContain("Personal update");
  expect(second).toContain("Retry notifications");
  expect(second).not.toContain("secret announcement failure");
 });
 it("keeps partial list usable if unread count fails",async()=>{
  stubs.unread.mockRejectedValueOnce(new Error("counter unavailable"));
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("Unread counts are temporarily unavailable");
  expect(html).toContain("Personal update");
  expect(html).toContain("College update");
  expect(html).not.toContain("counter unavailable");
 });
 it("rejects non-Faculty actors before querying inbox sources",async()=>{
  stubs.actor.mockResolvedValueOnce({...actor,membership:{...actor.membership,roles:["LEARNER"]}});
  await expect(page()).rejects.toThrow("REDIRECT_/learn/notifications");
  expect(stubs.personal).not.toHaveBeenCalled();
  expect(stubs.announcement).not.toHaveBeenCalled();
 });
 it("supplies loading and hard-error recovery without displaying raw exceptions",()=>{
  const pending=renderToStaticMarkup(createElement(Loading));
  expect(pending).toContain("Loading notifications");
  expect(pending).toContain('aria-busy="true"');
  const failed=renderToStaticMarkup(createElement(ErrorBoundary,{
   error:new Error("private db detail"),reset:()=>{},
  }));
  expect(failed).toContain("Retry");
  expect(failed).not.toContain("private db detail");
 });
});
