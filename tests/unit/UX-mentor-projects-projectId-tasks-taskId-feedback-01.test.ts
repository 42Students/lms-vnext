import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/tasks/[taskId]/feedback",()=>{
 it("UX-mentor-projects-projectId-tasks-taskId-feedback-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorTaskFeedback\s*\(/);
 });
 it("UX-mentor-projects-projectId-tasks-taskId-feedback-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("title=\"Recorded task review feedback\"");
  expect(src).toContain("EmptyState");
 });
});
