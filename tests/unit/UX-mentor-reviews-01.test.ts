import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/reviews/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/reviews",()=>{
 it("UX-mentor-reviews-01 retains scope-aware service resolution",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorReviewQueue\s*\(/);
 });
 it("UX-mentor-reviews-02 preserves exact legacy labels and navigable pagination",()=>{
  expect(src).toContain("title=\"Delivery review queue\"");
  expect(src).toContain("mentorReviewExportHref");
 });
});
