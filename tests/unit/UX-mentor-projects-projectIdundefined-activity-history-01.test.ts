import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor/projects/[projectId]/activity-history";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor/projects/[projectId]/activity-history audit contract",()=>{
 it("UX-mentor-projects-projectIdundefined-activity-history-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("getMentorProjectActivityHistory"=== "" ? /\w+/ : /getMentorProjectActivityHistory\s*\(/);
 });
 it("UX-mentor-projects-projectIdundefined-activity-history-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("title=\"Recorded project activity\"");
  expect(src).toContain("mentorProjectActivityQuerySchema.safeParse");
 });
});
