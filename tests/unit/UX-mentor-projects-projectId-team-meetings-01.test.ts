import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/team-meetings",()=>{
 it("UX-mentor-projects-projectId-team-meetings-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorTeamMeetings\s*\(/);
 });
 it("UX-mentor-projects-projectId-team-meetings-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("title=\"Team &amp; meeting log\"");
  expect(src).toContain("MentorMeetingReschedule");
 });
});
