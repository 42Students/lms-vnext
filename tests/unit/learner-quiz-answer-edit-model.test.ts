import {describe,expect,it} from "vitest";
import {clearLearnerQuizAnswer} from "@/modules/courses/learner-quiz-answer-edit-model";
describe("learner quiz clear answer",()=>{
 it("removes only the selected question and preserves other selections",()=>{
  const draft={one:["a"],two:["b","c"]};
  expect(clearLearnerQuizAnswer(draft,"one")).toEqual({two:["b","c"]});
  expect(draft).toEqual({one:["a"],two:["b","c"]});
 });
 it("unknown question id does not remove another answer",()=>{
  expect(clearLearnerQuizAnswer({one:["a"]},"other")).toEqual({one:["a"]});
 });
});
