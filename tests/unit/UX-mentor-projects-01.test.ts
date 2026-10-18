import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects",()=>{
 it("UX-mentor-projects-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/listMyProjectInstances\s*\(/);
 });
 it("UX-mentor-projects-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain("title=\"Projects\"");
  expect(src).toContain("ProjectParticipantPagination");
 });
});
