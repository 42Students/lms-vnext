import {describe,expect,it} from "vitest";
import {learnerDiscussionDraftValid,LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH as MAX}
 from "@/modules/courses/learner-discussion-message-limit-model";
describe("learner discussion message limit",()=>{
 it("accepts the maximum 4000 characters enforced by server validation",()=>{
  expect(MAX).toBe(4000);
  expect(learnerDiscussionDraftValid("x".repeat(MAX))).toBe(true);
 });
 it("rejects overlimit, whitespace-only and pasted overlimit text",()=>{
  expect(learnerDiscussionDraftValid("x".repeat(MAX+1))).toBe(false);
  expect(learnerDiscussionDraftValid("   ")).toBe(false);
 });
});
