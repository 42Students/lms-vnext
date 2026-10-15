import {describe,expect,it} from "vitest";
import {learnerDiscussionScopeKey} from "@/modules/courses/learner-discussion-scope-key-model";
describe("learner discussion identity isolation",()=>{
 it("changes the mounted discussion key between authorized deliveries",()=>{
  expect(learnerDiscussionScopeKey("11111111-1111-4111-8111-111111111111"))
   .not.toBe(learnerDiscussionScopeKey("22222222-2222-4222-8222-222222222222"));
 });
 it("does not accept arbitrary untrusted component keys",()=>{
  expect(()=>learnerDiscussionScopeKey("../../../another-course")).toThrow();
 });
});
