import {describe,it,expect} from "vitest";
import {learnerQuizRefreshFailureMessage} from "@/modules/courses/learner-quiz-refresh-failure-model";
describe("quiz accepted submission with failed results refresh",()=>{
 it("does not report failed submission after a successful POST",()=>{
  expect(learnerQuizRefreshFailureMessage(true,new Error("History unavailable"))).toContain("was submitted");
 });
 it("keeps a true initial GET error distinct without leaking forbidden codes or stack traces",()=>{
  const message=learnerQuizRefreshFailureMessage(false,new Error("Forbidden INTERNAL_ERROR db-password"));
  expect(message).toBe("Unable to load this quiz. Please try again.");
  expect(message).not.toMatch(/Forbidden|INTERNAL_ERROR|db-password/);
 });
});
