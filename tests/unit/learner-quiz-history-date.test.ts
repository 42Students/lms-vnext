import {describe,it,expect} from "vitest";
import {learnerQuizAttemptDateLabel} from "@/modules/courses/learner-quiz-history-model";
describe("learner Quiz history India-local instants",()=>{
 it("uses Asia/Kolkata including a UTC midnight crossover",()=>{
  expect(learnerQuizAttemptDateLabel(new Date("2026-10-15T23:45:00Z"))).toContain("16 Oct 2026");
 });
 it("does not throw on malformed persisted timestamps",()=>{
  expect(learnerQuizAttemptDateLabel(new Date("invalid"))).toBe("Date unavailable");
 });
});
