import { describe, expect, it } from "vitest";
import {
  collegePersonIdSchema, collegePersonDetailQuerySchema,
  recordedAttendanceSummary, collegeStudentEnrollmentQuerySchema,
} from "@/modules/people/college-person-detail-model";

describe("College person detail contracts", () => {
  it("rejects non-UUID membership ids and caller-controlled scope", () => {
    expect(collegePersonIdSchema.safeParse("foreign").success).toBe(false);
    expect(collegePersonDetailQuerySchema.safeParse({ collegeId: "foreign" }).success).toBe(false);
    expect(collegePersonDetailQuerySchema.parse({})).toEqual({});
  });
  it("validates history status without allowing caller-controlled college ids",()=>{
    expect(collegeStudentEnrollmentQuerySchema.parse({})).toEqual({status:"ALL"});
    expect(collegeStudentEnrollmentQuerySchema.parse({status:"WITHDRAWN"})).toEqual({status:"WITHDRAWN"});
    expect(collegeStudentEnrollmentQuerySchema.safeParse({status:"ARCHIVED"}).success).toBe(false);
    expect(collegeStudentEnrollmentQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  });
  it("does not manufacture attendance from sessions lacking explicit records", () => {
    expect(recordedAttendanceSummary([])).toEqual({
      recordedMarkedEvents: 0, presentOrLate: 0, absent: 0,
      excused: 0, medical: 0, recordedPercent: null,
    });
    expect(recordedAttendanceSummary([
      { status: "PRESENT", count: 2 },
      { status: "LATE", count: 1 },
      { status: "ABSENT", count: 1 },
      { status: "EXCUSED", count: 1 },
    ])).toMatchObject({ recordedMarkedEvents: 5, presentOrLate: 3, recordedPercent: 60 });
  });
});
