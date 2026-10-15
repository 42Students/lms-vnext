import {describe,it,expect} from "vitest";
import {learnerQuizRefreshFailureMessage} from "@/modules/courses/learner-quiz-refresh-failure-model";
describe("quiz accepted submission with failed results refresh",()=>{
 it("does not report failed submission after a successful POST",()=>{
  expect(learnerQuizRefreshFailureMessage(true,new Error("History unavailable"))).toContain("was submitted");
 });
 it("keeps a true initial GET error distinct",()=>{
  expect(learnerQuizRefreshFailureMessage(false,new Error("Forbidden"))).toBe("Forbidden");
 });
});
