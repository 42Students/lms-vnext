import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]",()=>{
 it("UX-mentor-projects-projectId-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/requireProjectReadAccess\s*\(/);
 });
 it("UX-mentor-projects-projectId-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain("prototype-mentor-project-heading");
  expect(src).toContain("workspace.sprints");
  expect(src).toContain("MentorProjectTabs");
 });
});
