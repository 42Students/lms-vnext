import {describe,expect,it} from "vitest";
import {learnerDiscussionRefreshIsCurrent} from "@/modules/courses/learner-discussion-refresh-order-model";
describe("learner discussion refresh order",()=>{
 it("discards an earlier response completing after a newer request",()=>{
  expect(learnerDiscussionRefreshIsCurrent(1,2)).toBe(false);
  expect(learnerDiscussionRefreshIsCurrent(2,2)).toBe(true);
 });
 it("rejects uninitialized or corrupted response identities",()=>{
  expect(learnerDiscussionRefreshIsCurrent(0,0)).toBe(false);
  expect(learnerDiscussionRefreshIsCurrent(NaN,1)).toBe(false);
 });
});
