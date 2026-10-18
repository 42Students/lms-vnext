import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor/projects/[projectId]/board-review";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor/projects/[projectId]/board-review audit contract",()=>{
 it("UX-mentor-projects-projectIdundefined-board-review-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("getMentorBoardReview"=== "" ? /\w+/ : /getMentorBoardReview\s*\(/);
 });
 it("UX-mentor-projects-projectIdundefined-board-review-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("title=\"Task board status\"");
  expect(src).toContain("mentorBoardReviewQuerySchema.safeParse");
 });
});
