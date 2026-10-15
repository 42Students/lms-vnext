import {describe,it,expect} from "vitest";
import {learnerDashboardDateLabel} from "@/modules/placements/learner-dashboard-date-label-model";
describe("learner dashboard event time display",()=>{
 it("makes unusable persisted dates explicit instead of throwing",()=>{
  expect(learnerDashboardDateLabel(new Date("wrong"))).toBe("Time not available");
 });
 it("displays UTC instants in India standard time",()=>{
  expect(learnerDashboardDateLabel(new Date("2026-10-15T10:00:00Z"))).toContain("2026");
 });
});
