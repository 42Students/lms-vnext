import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-14 mentor UX rollout batch 03",()=>{
 it("UX-mentor-mentor-review-history-01 keeps accessible page controls",()=>{
 const src=readFileSync("src/app/(authenticated)/mentor/review-history/page.tsx","utf8");
 expect(src).toContain("min-w-0 max-w-full");
 expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-reviews-01 keeps accessible page controls",()=>{
 const src=readFileSync("src/app/(authenticated)/mentor/reviews/page.tsx","utf8");
 expect(src).toContain("min-w-0 max-w-full");
 expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-sprint-progress-01 keeps accessible page controls",()=>{
 const src=readFileSync("src/app/(authenticated)/mentor/sprint-progress/page.tsx","utf8");
 expect(src).toContain("min-w-0 max-w-full");
 expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-task-review-history-01 keeps accessible page controls",()=>{
 const src=readFileSync("src/app/(authenticated)/mentor/task-review-history/page.tsx","utf8");
 expect(src).toContain("min-w-0 max-w-full");
 expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-task-reviews-01 keeps accessible page controls",()=>{
 const src=readFileSync("src/app/(authenticated)/mentor/task-reviews/page.tsx","utf8");
 expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-mentor-team-coverage-01 keeps accessible page controls",()=>{
 const src=readFileSync("src/app/(authenticated)/mentor/team-coverage/page.tsx","utf8");
 expect(src).toContain("min-w-0 max-w-full");
 expect(src).not.toContain("min-h-10");
 });
});
