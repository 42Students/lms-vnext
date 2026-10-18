import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor/projects/[projectId]/closeout";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor/projects/[projectId]/closeout audit contract",()=>{
 it("UX-mentor-projects-projectIdundefined-closeout-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("getMentorProjectCloseout"=== "" ? /\w+/ : /getMentorProjectCloseout\s*\(/);
 });
 it("UX-mentor-projects-projectIdundefined-closeout-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("title=\"Project closeout\"");
  expect(src).toContain("data.checklist.canComplete");
 });
});
