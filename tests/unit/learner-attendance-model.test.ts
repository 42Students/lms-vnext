import {
  describe,
  expect,
  it,
} from "vitest";
import {
  learnerAttendanceStatus,
  summarizeLearnerAttendance,
  type LearnerAttendanceRow,
} from "@/modules/attendance/model";

function row(
  overrides: Partial<LearnerAttendanceRow>,
): LearnerAttendanceRow {
  return {
    id: crypto.randomUUID(),
    deliveryId:
      "11111111-1111-4111-8111-111111111111",
    courseId:
      "22222222-2222-4222-8222-222222222222",
    courseName: "Course",
    courseCode: "C1",
    sectionName: "A",
    title: "Class",
    startsAt: new Date("2026-10-01T04:30:00Z"),
    endsAt: new Date("2026-10-01T05:30:00Z"),
    location: null,
    facultyName: null,
    sessionStatus: null,
    recordStatus: null,
    markedAt: null,
    ...overrides,
  };
}

describe("learner attendance model", () => {
  it("never treats an unmarked session as present", () => {
    expect(
      learnerAttendanceStatus(
        row({
          sessionStatus: "UNMARKED",
          recordStatus: null,
        }),
      ),
    ).toBe("NOT_MARKED");

    expect(
      learnerAttendanceStatus(
        row({
          sessionStatus: null,
          recordStatus: null,
        }),
      ),
    ).toBe("NOT_MARKED");
  });

  it("treats a marked session without an exception record as present", () => {
    expect(
      learnerAttendanceStatus(
        row({
          sessionStatus: "MARKED",
          recordStatus: null,
        }),
      ),
    ).toBe("PRESENT");
  });

  it("excludes unmarked sessions from the attendance denominator", () => {
    const summary =
      summarizeLearnerAttendance([
        row({
          sessionStatus: "MARKED",
          recordStatus: null,
        }),
        row({
          sessionStatus: "MARKED",
          recordStatus: "ABSENT",
        }),
        row({
          sessionStatus: "UNMARKED",
          recordStatus: null,
        }),
      ]);

    expect(summary).toEqual({
      heldSessions: 3,
      markedSessions: 2,
      unmarkedSessions: 1,
      present: 1,
      absent: 1,
      percentage: 50,
    });
  });
});
