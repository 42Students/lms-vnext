import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Unread learner placement notifications",()=>{
 it("LEARNER-placements-01 uses a persisted and tenant-scoped unread count",()=>{
  const s=read("src/modules/placements/learner-placement-alerts-service.ts");
  const layout=read("src/app/(authenticated)/learn/my-placements/layout.tsx");
  const tabs=read("src/components/placements/learner-placements-tabs.tsx");
  expect(s).toContain("count(*)::int");
  expect(s).toContain("isNull(inAppNotifications.readAt)");
  expect(s).toContain("eq(activityEvents.collegeId,membership.collegeId)");
  const unreadCount=s.slice(s.indexOf("export async function getUnreadOwnLearnerPlacementAlertCount"));
  expect(unreadCount).toContain('ne(activityEvents.subjectType,"announcement")');
  expect(unreadCount).toContain('ne(activityEvents.eventType,"PLACEMENT_ANNOUNCEMENT")');
  expect(unreadCount).toContain("isNull(inAppNotifications.readAt)");
  expect(layout).toContain("getUnreadOwnLearnerPlacementAlertCount(context)");
  expect(tabs).toContain('unreadPersonalAlerts: _unreadPersonalAlerts=null');
  expect(tabs).toContain('tab.label==="Notices" && unreadCollegeAnnouncements!==null && unreadCollegeAnnouncements>0');
  expect(tabs).not.toContain('count: unreadPersonalAlerts');
 });
 it("LEARNER-placements-46 does not confuse loaded preview size with all unread alerts",()=>{
  const page=read("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
  expect(page).toContain("getUnreadOwnLearnerPlacementAlertCount(context)");
  expect(page).toContain('<section id="college-notices"');
  expect(page).toContain('<div id="personal-updates"');
  expect(page).toContain('href={tabHref("announcements")}');
  expect(page).toContain('href={tabHref("updates")}');
  expect(page).not.toContain("Updates about you ({personalAlerts.items.length})");
 });
});
