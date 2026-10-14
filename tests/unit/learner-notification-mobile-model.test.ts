import {describe,expect,it} from "vitest";
import {learnerNotificationMobileFilterSummary} from "@/modules/activity/learner-notification-mobile-model";
describe("learner notification mobile filters",()=>{
 it("summarizes only validated category and status state",()=>{
  expect(learnerNotificationMobileFilterSummary({category:"job",unread:"unread",q:"Interview"},1))
    .toBe("1 matching notification · placements · unread only · searched");
  expect(learnerNotificationMobileFilterSummary({category:"all",unread:"all",q:""},0))
    .toBe("0 matching notifications · all categories");
 });
 it("does not disclose query text or trust negative counts",()=>{
  expect(learnerNotificationMobileFilterSummary({category:"general",unread:"all",q:"private phone"},-20))
    .toBe("0 matching notifications · general · searched");
 });
});
