import {describe,it,expect} from "vitest";
import {learnerAttendanceThresholdReached} from "@/modules/attendance/learner-attendance-threshold-model";
describe("learner Attendance exact eligibility threshold",()=>{
  it("does not promote rounded 74.6 percent to a passing 75 percent",()=>{
    expect(learnerAttendanceThresholdReached(373,500,75)).toBe(false);
    expect(learnerAttendanceThresholdReached(375,500,75)).toBe(true);
  });
  it("keeps unknown marks and invalid values out of the status decision",()=>{
    expect(learnerAttendanceThresholdReached(0,0,75)).toBe(false);
    expect(learnerAttendanceThresholdReached(3,2,75)).toBe(false);
  });
});
