import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/notifications/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/notifications",()=>{
 it("UX-mentor-notifications-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorPersonalInbox\s*\(/);
 });
 it("UX-mentor-notifications-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain("title=\"Notifications\"");
  expect(src).toContain("failedSources.push");
 });
});
