import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/task-reviews/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/task-reviews",()=>{
 it("UX-mentor-task-reviews-01 retains scope-aware service resolution",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorTaskReviews\s*\(/);
 });
 it("UX-mentor-task-reviews-02 preserves exact legacy labels and navigable pagination",()=>{
  expect(src).toContain("title=\"Task reviews\"");
  expect(src).toContain("mentorTaskReviewHref");
 });
});
