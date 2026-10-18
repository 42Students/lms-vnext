import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/task-review-history/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/task-review-history",()=>{
 it("UX-mentor-task-review-history-01 retains scope-aware service resolution",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorTaskReviewHistory\s*\(/);
 });
 it("UX-mentor-task-review-history-02 preserves exact legacy labels and navigable pagination",()=>{
  expect(src).toContain("title=\"Reviewed task submissions\"");
  expect(src).toContain("mentorTaskHistoryHref");
 });
});
