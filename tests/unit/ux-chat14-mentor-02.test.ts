import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-14 mentor UX rollout batch 02",()=>{
 it("UX-mentor-mentor-projects-projectId-meetings-meetingId-notes-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-resources-directory-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-review-completeness-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-mentor-mentor-projects-projectId-review-overview-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-risk-readiness-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-tasks-taskId-feedback-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-team-history-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-team-meetings-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-timeline-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-mentor-mentor-reports-01 preserves responsive/touch source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/reports/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
});
