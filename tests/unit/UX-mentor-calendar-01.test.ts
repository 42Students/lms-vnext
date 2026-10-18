import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor/calendar";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor/calendar audit contract",()=>{
 it("UX-mentor-calendar-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("listMyMentorCalendarMeetings"=== "" ? /\w+/ : /listMyMentorCalendarMeetings\s*\(/);
 });
 it("UX-mentor-calendar-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("title=\"Meetings\"");
  expect(src).toContain("loadFailed={access===null}");
 });
});
