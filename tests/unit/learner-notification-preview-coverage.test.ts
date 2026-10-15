import {describe,it,expect} from "vitest";
import {learnerNotificationPreviewNotice} from "@/modules/activity/learner-notification-preview-notice-model";
describe("learner notifications landing feed coverage",()=>{
 it("warns when the 60-message source cap is reached",()=>{
  expect(learnerNotificationPreviewNotice(60,60)).toContain("Older messages may");
 });
 it("describes the loaded subset without claiming account-wide totals",()=>{
  expect(learnerNotificationPreviewNotice(5,60)).toContain("5 loaded");
  expect(learnerNotificationPreviewNotice(5,60)).not.toContain("total");
 });
 it("recovers bad pagination metadata without claiming a false zero",()=>{
  expect(learnerNotificationPreviewNotice(5,0)).toContain("unavailable");
 });
});