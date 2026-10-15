import {describe,it,expect} from "vitest";
import {learnerQuizRouteScopeCurrent} from "@/modules/courses/learner-quiz-route-scope-model";
describe("learner Quiz state cannot cross quiz/delivery links",()=>{
 it("hides old answers until the new delivery-scoped response is loaded",()=>{
  expect(learnerQuizRouteScopeCurrent("quiz-2:delivery-a","quiz-1:delivery-a")).toBe(false);
  expect(learnerQuizRouteScopeCurrent("quiz-1:delivery-b","quiz-1:delivery-a")).toBe(false);
  expect(learnerQuizRouteScopeCurrent("quiz-1:delivery-a","quiz-1:delivery-a")).toBe(true);
 });
 it("does not display uninitialized old quiz state",()=>expect(learnerQuizRouteScopeCurrent("q:d",null)).toBe(false));
});
