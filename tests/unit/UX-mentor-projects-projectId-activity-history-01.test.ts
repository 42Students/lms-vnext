import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/activity-history",()=>{
 it("UX-mentor-projects-projectId-activity-history-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorProjectActivityHistory\s*\(/);
 });
 it("UX-mentor-projects-projectId-activity-history-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain("title=\"Recorded project activity\"");
  expect(src).toContain("mentorProjectActivityQuerySchema.safeParse");
 });
});
