import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Learner notification legacy copy",()=>{
 it("LEARNER-profile-misc-23 removes extraneous history header counts and pinned duplication while retaining feed",()=>{
  const page=readFileSync("src/app/(authenticated)/learn/notifications/page.tsx","utf8");
  const inbox=readFileSync("src/components/activity/learner-notifications-inbox.tsx","utf8");
  expect(page).not.toContain("Browse older personal notifications");
  expect(inbox).not.toContain("Pinned college announcements");
  expect(inbox).not.toContain("counts[key]");
  expect(inbox).toContain("NotificationList");
  expect(inbox).toContain("Browse personal history");
  expect(inbox).toContain('source: "ANNOUNCEMENT"');
 });
});
