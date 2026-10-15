import {describe,expect,it} from "vitest";
import {createLearnerDiscussionHistoryFlight} from "@/modules/courses/learner-discussion-history-flight-model";
describe("Learner Discussion history flight guard",()=>{
 it("allows exactly one in-flight request per component",()=>{
  const guard=createLearnerDiscussionHistoryFlight();
  expect(guard.begin()).toBe(true);
  expect(guard.begin()).toBe(false);
  expect(guard.isBusy()).toBe(true);
 });
 it("releases the same cursor for retry after success or error",()=>{
  const guard=createLearnerDiscussionHistoryFlight();
  guard.begin();guard.end();
  expect(guard.begin()).toBe(true);
 });
});
