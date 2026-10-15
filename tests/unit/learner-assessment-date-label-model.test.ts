import {describe,expect,it} from "vitest";
import {learnerAssessmentDateLabel} from "@/modules/courses/learner-assessment-date-label-model";
describe("learner assessment published date labels",()=>{
 it("shows exact persisted UTC deadlines in college-local time",()=>{
  expect(learnerAssessmentDateLabel("2026-10-15T23:45:00Z")).toContain("16 Oct 2026");
 });
 it("never echoes malformed stored values as a valid deadline",()=>{
  expect(learnerAssessmentDateLabel(null)).toBe("No deadline");
  expect(learnerAssessmentDateLabel("malformed")).toBe("Date unavailable");
 });
});
