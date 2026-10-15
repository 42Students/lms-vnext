import {describe,expect,it} from "vitest";
import {learnerQuizQuestionNavState} from "@/modules/courses/learner-quiz-question-nav-model";
describe("learner quiz accessible question navigation",()=>{
 it("identifies exact active question and answered local state",()=>{
  expect(learnerQuizQuestionNavState(2,2,["choice"],["choice"])).toEqual({
   current:true,answered:true,label:"Go to question 3, answered",
  });
  expect(learnerQuizQuestionNavState(0,2,[],["choice"])).toMatchObject({current:false,answered:false,label:"Go to question 1, unanswered"});
 });
});

describe("quiz answer navigation rejects stale option IDs",()=>{
 it("does not mark a question answered for an option no longer published",()=>{
  const result=learnerQuizQuestionNavState(0,0,["deleted-option"],["valid-option"]);
  expect(result.answered).toBe(false);
  expect(result.label).toContain("unanswered");
 });
});
