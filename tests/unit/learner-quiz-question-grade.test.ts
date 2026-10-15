import {describe,it,expect} from "vitest";
import {learnerQuizQuestionAwardLabel} from "@/modules/courses/learner-quiz-history-model";
describe("published Quiz question score",()=>{
 it("shows genuine zeros but not missing marks as scored zeros",()=>{
  expect(learnerQuizQuestionAwardLabel(0,4)).toBe("Awarded 0 / 4 points");
  expect(learnerQuizQuestionAwardLabel(null,4)).toBe("Question marks unavailable");
 });
});
