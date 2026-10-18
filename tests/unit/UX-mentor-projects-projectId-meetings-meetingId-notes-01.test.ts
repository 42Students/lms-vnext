import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/meetings/[meetingId]/notes",()=>{
 it("UX-mentor-projects-projectId-meetings-meetingId-notes-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorMeetingNotes\s*\(/);
 });
 it("UX-mentor-projects-projectId-meetings-meetingId-notes-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("<PageHeader");
  expect(src).toContain("MentorMeetingNotesEditor");
 });
});
