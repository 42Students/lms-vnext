import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {friendlyApiError} from "@/lib/friendly-error";
import {learnerQuizRefreshFailureMessage} from "@/modules/courses/learner-quiz-refresh-failure-model";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("GR-quiz-read-01 GR-quiz-submit-01 /quiz friendly failure safeguards",()=>{
 it("maps backend codes to friendly messages without echoing provider error bodies",()=>{
  expect(friendlyApiError({status:403,code:"Forbidden INTERNAL"})).not.toContain("INTERNAL");
  expect(friendlyApiError({status:500,code:"SECRETS_LEAKED"})).not.toContain("SECRETS");
  const source=read("src/components/courses/learner-quiz-attempt.tsx");
  expect(source).toContain("friendlyApiError({ status: response.status, code })");
  expect(source).not.toContain("payload?.message || payload?.error");
  expect(source).not.toContain("cause instanceof Error ? cause.message");
 });
 it("protects completed learner submissions when read-back fails",()=>{
  const safe=learnerQuizRefreshFailureMessage(true,new Error("db credential"));
  expect(safe).toContain("Your quiz was submitted");
  expect(safe).toContain("Open All Quizzes");
  expect(safe).not.toContain("credential");
  const source=read("src/components/courses/learner-quiz-attempt.tsx");
  expect(source).toContain("setConfirmedSubmissionQuizId(quiz.quiz.id)");
  expect(source).toContain("learnerQuizRefreshFailureMessage(afterSubmit,cause)");
  expect(source).toContain("submittingRef.current = true");
  expect(source).toContain("submittingRef.current = false");
 });
});
