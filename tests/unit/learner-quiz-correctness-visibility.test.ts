import {describe,it,expect} from "vitest";
import {canReviewLearnerQuizCorrectAnswers} from "@/modules/courses/learner-quiz-correctness-visibility-model";
describe("learner Quiz correct-answer publication fence",()=>{
 it("allows option correctness only after both publication checks",()=>{
  expect(canReviewLearnerQuizCorrectAnswers(true,true)).toBe(true);
  expect(canReviewLearnerQuizCorrectAnswers(true,false)).toBe(false);
  expect(canReviewLearnerQuizCorrectAnswers(false,true)).toBe(false);
  expect(canReviewLearnerQuizCorrectAnswers(false,false)).toBe(false);
 });
});
