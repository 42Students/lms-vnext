import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/timeline",()=>{
 it("UX-mentor-projects-projectId-timeline-01 retains scope-aware service resolution",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorProjectTimeline\s*\(/);
 });
 it("UX-mentor-projects-projectId-timeline-02 preserves exact legacy labels and navigable pagination",()=>{
  expect(src).toContain('title="Release & Sprint timeline"');
  expect(src).toContain("mentorTimelineHref");
 });
});
