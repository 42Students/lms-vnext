import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/activity/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/activity",()=>{
 it("UX-mentor-activity-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorPortfolioActivity\s*\(/);
 });
 it("UX-mentor-activity-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain("title=\"Project activity\"");
  expect(src).toContain("mentorActivityQuerySchema.safeParse");
 });
});
