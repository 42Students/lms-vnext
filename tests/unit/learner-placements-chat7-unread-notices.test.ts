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
  expect(layout).toContain("getUnreadOwnLearnerPlacementAlertCount(context)");
  expect(tabs).toContain('title="Unread personal placement alerts"');
 });
 it("LEARNER-placements-46 does not confuse loaded preview size with all unread alerts",()=>{
  const page=read("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
  expect(page).toContain("getUnreadOwnLearnerPlacementAlertCount(context)");
  expect(page).toContain('href="#college-notices"');
  expect(page).toContain('href="#personal-updates"');
  expect(page).not.toContain("Updates about you ({personalAlerts.items.length})");
 });
});
