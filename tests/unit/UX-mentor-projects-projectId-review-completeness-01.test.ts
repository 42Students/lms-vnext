import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/review-completeness",()=>{
 it("UX-mentor-projects-projectId-review-completeness-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorProjectReviewCompleteness\s*\(/);
 });
 it("UX-mentor-projects-projectId-review-completeness-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("title=\"Delivery review completeness\"");
  expect(src).toContain("mentorReviewCompletenessQuerySchema.safeParse");
 });
});
