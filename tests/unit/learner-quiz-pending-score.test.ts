import {describe,it,expect} from "vitest";
import {learnerAttemptResultLabel} from "@/modules/courses/learner-quiz-history-model";
describe("learner standalone quiz result disclosure",()=>{
 it("never invents a zero score when released marks are null",()=>{
  expect(learnerAttemptResultLabel({resultsVisible:true,score:null,maxScore:100})).toBe("Score unavailable");
  expect(learnerAttemptResultLabel({resultsVisible:true,score:0,maxScore:100})).toBe("0 / 100 points");
 });
 it("keeps unpublished grades concealed even with persisted scores",()=>{
  expect(learnerAttemptResultLabel({resultsVisible:false,score:98,maxScore:100})).toBe("Result not published");
 });
});
