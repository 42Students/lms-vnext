import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("TPO personal notification settings decision",()=>{
 it("TPO-settings-audit-80 NOT-A-GAP preserves working inbox and read actions without inventing legacy UI switches",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/notifications/page.tsx","utf8");
  const model=readFileSync("src/modules/activity/tpo-notifications-model.ts","utf8");
  expect(page).toContain("getTpoPersonalInbox");
  expect(page).toContain("<NotificationToolbar");
  expect(page).toContain("markAllEndpoint");
  expect(page).toContain("readEndpoint");
  expect(model).toContain("TPO_NOTIFICATIONS_PATH");
  expect(page).not.toContain("Personal notification preferences");
 });
});