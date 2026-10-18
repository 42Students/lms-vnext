import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/team-coverage/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/team-coverage",()=>{
 it("UX-mentor-team-coverage-01 retains scope-aware service resolution",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorTeamCoverage\s*\(/);
 });
 it("UX-mentor-team-coverage-02 preserves exact legacy labels and navigable pagination",()=>{
  expect(src).toContain("title=\"Team coverage\"");
  expect(src).toContain("mentorTeamCoverageHref");
 });
});
