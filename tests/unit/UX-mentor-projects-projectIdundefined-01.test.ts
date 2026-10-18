import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor/projects/[projectId]";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor/projects/[projectId] audit contract",()=>{
 it("UX-mentor-projects-projectIdundefined-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("requireProjectReadAccess"=== "" ? /\w+/ : /requireProjectReadAccess\s*\(/);
 });
 it("UX-mentor-projects-projectIdundefined-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("<PageHeader");
  expect(src).toContain("MentorProjectTabs");
 });
});
