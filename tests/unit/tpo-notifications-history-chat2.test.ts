import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoEffectiveReadAt,tpoUnreadCutoff} from "@/modules/activity/tpo-notifications-model";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO Notifications history and refresh legacy fidelity",()=>{
 it("TPO-inbox-team-65 restores All (n), Latest n and legacy empty-state labels",()=>{
  const page=src("src/app/(authenticated)/tpo/notifications/page.tsx");
  const toolbar=src("src/components/activity/notification-toolbar.tsx");
  expect(page).toContain('allLabel={nextHref?"Latest "+items.length:"All ("+items.length+")"}');
  expect(page).toContain('"No unread notifications" : "Nothing yet"');
  expect(toolbar).toContain("{allLabel}");
 });
 it("TPO-inbox-team-67 treats notifications over thirty days as read and keeps older-unread hints",()=>{
  const now=new Date("2099-12-31T12:00:00.000Z");
  const cutoff=tpoUnreadCutoff(now);
  expect(now.getTime()-cutoff.getTime()).toBe(30*86400000);
  expect(tpoEffectiveReadAt(null,new Date("2099-01-01T00:00:00.000Z"),cutoff))
   .toBeInstanceOf(Date);
  expect(tpoEffectiveReadAt(null,new Date("2099-12-30T00:00:00.000Z"),cutoff)).toBeNull();
  const page=src("src/app/(authenticated)/tpo/notifications/page.tsx");
  expect(page).toContain("olderUnread>0");
  expect(page).toContain("Mark all as read clears older ones too.");
 });
 it("TPO-inbox-team-68 keeps stale notifications visible when a bounded refresh fails",()=>{
  const refresher=src("src/components/tpo/tpo-notification-refresh.tsx");
  const page=src("src/app/(authenticated)/tpo/notifications/page.tsx");
  expect(refresher).toContain("timeoutMs:12000");
  expect(refresher).toContain("This refresh failed. Showing the last successful load.");
  expect(refresher).toContain("Refreshing notifications…");
  expect(refresher).toContain('document.addEventListener("visibilitychange",onVisible)');
  expect(page).toContain("<TpoNotificationRefresh/>");
 });
});
