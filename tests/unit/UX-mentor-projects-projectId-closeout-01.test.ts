import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/closeout",()=>{
 it("UX-mentor-projects-projectId-closeout-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorProjectCloseout\s*\(/);
 });
 it("UX-mentor-projects-projectId-closeout-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain("title=\"Project closeout\"");
  expect(src).toContain("data.checklist.canComplete");
 });
});
