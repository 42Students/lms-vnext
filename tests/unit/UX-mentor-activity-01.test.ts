import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor/activity";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor/activity audit contract",()=>{
 it("UX-mentor-activity-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("getMentorPortfolioActivity"=== "" ? /\w+/ : /getMentorPortfolioActivity\s*\(/);
 });
 it("UX-mentor-activity-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("title=\"Project activity\"");
  expect(src).toContain("mentorActivityQuerySchema.safeParse");
 });
});
