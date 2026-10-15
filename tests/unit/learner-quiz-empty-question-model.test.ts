import {describe,expect,it} from "vitest";
import {learnerQuizEmptyQuestionMessage} from "@/modules/courses/learner-quiz-empty-question-model";
describe("learner quiz missing question payload",()=>{
 it("prevents a misleading no-attempt review when no questions exist",()=>{
  expect(learnerQuizEmptyQuestionMessage(0)).toContain("cannot start an attempt");
  expect(learnerQuizEmptyQuestionMessage(1)).toBeNull();
 });
});
