import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/review-history/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/review-history",()=>{
 it("UX-mentor-review-history-01 retains scope-aware service resolution",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorReviewHistory\s*\(/);
 });
 it("UX-mentor-review-history-02 preserves exact legacy labels and navigable pagination",()=>{
  expect(src).toContain("title=\"Delivery review history\"");
  expect(src).toContain("mentorReviewHistoryHref");
 });
});
