import {describe,expect,it} from "vitest";
import {learnerDiscussionMayPost} from "@/modules/courses/learner-discussion-submit-guard-model";
describe("discussion submission concurrency",()=>{
 it("allows one authorized nonempty draft",()=>{
  expect(learnerDiscussionMayPost(" Hello ",true,false)).toBe(true);
 });
 it("blocks duplicate events, read-only history and blank messages",()=>{
  expect(learnerDiscussionMayPost("Hello",true,true)).toBe(false);
  expect(learnerDiscussionMayPost("Hello",false,false)).toBe(false);
  expect(learnerDiscussionMayPost("  ",true,false)).toBe(false);
 });
});
