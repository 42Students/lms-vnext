import {describe,it,expect} from "vitest";
import {learnerApplicationDateLabel} from "@/modules/placements/learner-application-date-label-model";
describe("application date labels",()=>{
 it("handles incomplete or corrupted saved dates",()=>{
  expect(learnerApplicationDateLabel(null)).toBe("Not available");
  expect(learnerApplicationDateLabel(new Date("invalid"))).toBe("Not available");
 });
 it("formats a valid submitted instant in the college timezone",()=>{
  expect(learnerApplicationDateLabel(new Date("2026-10-15T09:00:00Z"))).toContain("2026");
 });
});