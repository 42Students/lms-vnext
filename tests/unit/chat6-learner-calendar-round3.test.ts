import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Learner calendar legacy copy",()=>{
 it("LEARNER-profile-misc-24 restores the today next and all courses schedule labels",()=>{
  const code=readFileSync("src/components/academics/learner-class-schedule.tsx","utf8");
  expect(code).toContain('value={todayEvents.length+" today"}');
  expect(code).toContain("Next:");
  expect(code).toContain("All courses");
 });
 it("LEARNER-profile-misc-25 renders the legacy partial calendar failure with Retry",()=>{
  const code=readFileSync("src/app/(authenticated)/learn/calendar/error.tsx","utf8");
  expect(code).toContain("Calendar events may be incomplete. Please try refreshing the page.");
  expect(code).toContain("Retry");
 });
});
