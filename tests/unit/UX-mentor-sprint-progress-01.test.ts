import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/sprint-progress/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/sprint-progress",()=>{
 it("UX-mentor-sprint-progress-01 retains scope-aware service resolution",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorSprintProgress\s*\(/);
 });
 it("UX-mentor-sprint-progress-02 preserves exact legacy labels and navigable pagination",()=>{
  expect(src).toContain("title=\"Sprint progress\"");
  expect(src).toContain("mentorSprintProgressHref");
 });
});
