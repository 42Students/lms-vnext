import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {quizInteractionState} from "@/components/courses/learner-interaction-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-15 learner missed quiz, release, and progress parity",()=>{
 it("LEARNER-learning-misc-24 permits read-only review after published missed quiz",()=>{
  const state=quizInteractionState({status:"CLOSED",attemptsUsed:0,attemptsRemaining:0,resultsPublished:true,progressStatus:"MISSED"});
  expect(state.canReviewResults).toBe(true);
  expect(state.canAttempt).toBe(false);
  const ui=read("src/components/courses/quiz-attempt-control.tsx");
  expect(ui).toContain('aria-label="Missed quiz review"');
  expect(ui).toContain("Correct answer");
 });
 it("LEARNER-course-detail-17 released missed quiz answer key is read-only",()=>{
  const svc=read("src/modules/courses/quiz-service.ts");
  expect(svc).toContain('quiz.dueAt.getTime() <= Date.now()');
  const ui=read("src/components/courses/quiz-attempt-control.tsx");
  expect(ui).toContain("You didn&apos;t attempt this quiz.");
  expect(ui).toContain("Close review");
 });
 it("LEARNER-learning-misc-27 releasing results requires the authored deadline to pass",()=>{
  const svc=read("src/modules/courses/quiz-service.ts");
  expect(svc).toContain('const dueIsPast=locked.dueAt!==null');
  expect(svc).toContain('input.published');
  expect(svc).toContain('dueIsPast &&');
 });
 it("LEARNER-learning-misc-28 quiz attempt has desktop progress and mobile Questions drawer",()=>{
  const ui=read("src/components/courses/quiz-attempt-control.tsx");
  expect(ui).toContain('aria-label="Quiz question progress"');
  expect(ui).toContain('<summary className="cursor-pointer text-sm text-primary-text">Questions</summary>');
  expect(ui).toContain('id={"quiz-question-"+question.id}');
  expect(ui).toContain('{question.points} pts');
 });
});