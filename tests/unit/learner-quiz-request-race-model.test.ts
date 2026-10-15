import { describe,expect,it } from "vitest";
import { learnerQuizRequestCurrent } from "@/modules/courses/learner-quiz-request-race-model";
describe("learner quiz load race",()=>{
 it("rejects obsolete request results after route/unmount abort",()=>{
  const c=new AbortController();expect(learnerQuizRequestCurrent(c.signal)).toBe(true);
  c.abort();expect(learnerQuizRequestCurrent(c.signal)).toBe(false);
 });
 it("allows explicit retry or post-submit refresh without a request signal",()=>{
  expect(learnerQuizRequestCurrent()).toBe(true);
 });
});
