import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/reports/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/reports",()=>{
 it("UX-mentor-reports-01 retains scope-aware service resolution",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorReports\s*\(/);
 });
 it("UX-mentor-reports-02 preserves exact legacy labels and navigable pagination",()=>{
  expect(src).toContain("title=\"Assigned project reports\"");
  expect(src).toContain("mentorReportsHref");
 });
});
