import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/board-review",()=>{
 it("UX-mentor-projects-projectId-board-review-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorBoardReview\s*\(/);
 });
 it("UX-mentor-projects-projectId-board-review-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain("title=\"Task board status\"");
  expect(src).toContain("mentorBoardReviewQuerySchema.safeParse");
 });
});
