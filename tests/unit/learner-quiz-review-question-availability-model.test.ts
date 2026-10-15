import {describe,expect,it} from "vitest";
import {learnerQuizReviewQuestionNotice} from "@/modules/courses/learner-quiz-review-question-availability-model";
describe("quiz review when question details are unavailable",()=>{
 it("does not deny an already submitted attempt",()=>{
  expect(learnerQuizReviewQuestionNotice(0,true)).toContain("submitted attempt remains recorded");
 });
 it("prevents a new empty attempt without saying an existing receipt is lost",()=>{
  expect(learnerQuizReviewQuestionNotice(0,false)).toContain("cannot start an attempt");
  expect(learnerQuizReviewQuestionNotice(2,true)).toBeNull();
 });
});
