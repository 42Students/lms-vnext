import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/resources-directory",()=>{
 it("UX-mentor-projects-projectId-resources-directory-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorResourceDirectory\s*\(/);
 });
 it("UX-mentor-projects-projectId-resources-directory-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("title=\"Registered resource links\"");
  expect(src).toContain("parseMentorResourceDirectorySearch");
 });
});
