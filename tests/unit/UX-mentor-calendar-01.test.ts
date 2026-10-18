import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/calendar/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/calendar",()=>{
 it("UX-mentor-calendar-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/listMyMentorCalendarMeetings\s*\(/);
 });
 it("UX-mentor-calendar-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain("title=\"Meetings\"");
  expect(src).toContain("loadFailed={access===null}");
 });
});
