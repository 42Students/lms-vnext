import {describe,it,expect} from "vitest";
import {learnerNotificationTarget} from "@/modules/activity/learner-notification-inbox-model";
describe("LEARNER-profile-misc-19/20 notification drawer safe links",()=>{
 it("allows only learner-scoped links",()=>{
  expect(learnerNotificationTarget("/learn/allAssignments?tab=recent")).toBe("/learn/allAssignments?tab=recent");
  expect(learnerNotificationTarget("/tpo/requests")).toBeNull();
  expect(learnerNotificationTarget("//evil.test")).toBeNull();
 });
});
