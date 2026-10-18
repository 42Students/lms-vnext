import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/review-overview",()=>{
 it("UX-mentor-projects-projectId-review-overview-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorDeliveryReviewOverview\s*\(/);
 });
 it("UX-mentor-projects-projectId-review-overview-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("title=\"Delivery review overview\"");
  expect(src).toContain("mentorReviewOverviewSchema.safeParse");
 });
});
