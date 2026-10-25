import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("UX-chat7-learner-scroll-motion-01 hidden scrollbar resilience",()=>{
 it("names keyboard-operable Board lanes and explains horizontal scroll on phones",()=>{
  const board=read("src/components/projects/learner-board-interactive.tsx");
  expect(board).toContain('aria-label="Project Board lanes, scroll horizontally to see more"');
  expect(board).toContain("tabIndex={0}");
  const boardStyles=read("src/components/projects/legacy-project-board.module.css");
  expect(boardStyles).toContain("overscroll-behavior-x: contain");
  expect(boardStyles).toContain(".scrollRegion:focus-visible");
  expect(board).toContain("Scroll sideways to see all Board lanes.");
  expect(board).toContain('styles["scrollRegion"]');
  expect(board).toContain("min-h-11");
 });
 it("keeps both Semester course and credits lists operable without visible scrollbars",()=>{
  const list=read("src/components/courses/learner-course-list.tsx");
  expect(list).toContain('aria-label="Scrollable course list"');
  expect(list.match(/tabIndex=\{0\}/g)?.length).toBeGreaterThanOrEqual(2);
  expect(list.match(/overscroll-contain/g)?.length).toBeGreaterThanOrEqual(2);
  expect(list).toContain("Scroll inside the list for more courses.");
  expect(list).toContain("Scroll inside the list for the credits breakdown.");
 });
 it("makes long quiz submissions focusable and provides a non-scrollbar cue",()=>{
  const quizzes=read("src/components/courses/learner-assessment-overview.tsx");
  expect(quizzes).toContain('aria-label="Submitted quizzes, scroll for more"');
  expect(quizzes).toContain("tabIndex={0}");
  expect(quizzes).toContain("overscroll-contain");
  expect(quizzes).toContain("Scroll to see more submitted quizzes.");
 });
 it("retains the discussion composer and latest-message cues within a contained scroll region",()=>{
  const chat=read("src/components/courses/learner-course-discussion.tsx");
  expect(chat).toContain("overflow-y-auto overscroll-contain");
  expect(chat).toContain("Jump to latest");
  expect(chat).toContain("new {unseenCount === 1 ? \"message\" : \"messages\"}");
  expect(chat).toContain("Write a message");
 });
});
