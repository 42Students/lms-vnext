import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/team-history",()=>{
 it("UX-mentor-projects-projectId-team-history-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorTeamHistory\s*\(/);
 });
 it("UX-mentor-projects-projectId-team-history-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("title=\"Team membership history\"");
  expect(src).toContain("mentorTeamHistoryHref");
 });
});
