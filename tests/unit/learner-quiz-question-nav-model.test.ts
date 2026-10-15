import {describe,expect,it} from "vitest";
import {learnerQuizQuestionNavState} from "@/modules/courses/learner-quiz-question-nav-model";
describe("learner quiz accessible question navigation",()=>{
 it("identifies exact active question and answered local state",()=>{
  expect(learnerQuizQuestionNavState(2,2,["choice"])).toEqual({
   current:true,answered:true,label:"Go to question 3, answered",
  });
  expect(learnerQuizQuestionNavState(0,2,[])).toMatchObject({current:false,answered:false,label:"Go to question 1, unanswered"});
 });
});
