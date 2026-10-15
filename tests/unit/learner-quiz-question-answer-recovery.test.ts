import {describe,it,expect} from "vitest";
import {learnerQuizSelectedAnswerMessage} from "@/modules/courses/learner-quiz-history-model";
describe("published Quiz review missing options",()=>{
 it("distinguishes no saved answer from removed option metadata",()=>{
  expect(learnerQuizSelectedAnswerMessage([],[])).toContain("No answer");
  expect(learnerQuizSelectedAnswerMessage(["deleted"],[{id:"different"}])).toContain("unavailable");
  expect(learnerQuizSelectedAnswerMessage(["saved"],[{id:"saved"}])).toBeNull();
 });
});
