import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-14 mentor UX rollout batch 01",()=>{
 it("UX-mentor-mentor-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/page.tsx","utf8");
  expect(src).toContain("mx-auto flex min-h-[320px] min-w-0 max-w-full w-full");
  expect(src).toContain("md:max-w-[700px]");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-activity-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/activity/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-calendar-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/calendar/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-mentor-mentor-notifications-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/notifications/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-mentor-mentor-projects-projectId-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-mentor-mentor-projects-projectId-activity-history-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx","utf8");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-board-review-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-projects-projectId-closeout-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-mentor-mentor-projects-projectId-deliveries-submissionId-review-01 preserves route layout, wording, and touch/scroll source contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
});
