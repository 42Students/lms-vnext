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

  it("keeps future scheduled classes out of held/attendance math", () => {
    const now = new Date("2026-10-05T06:00:00Z");
    const future = row({
      startsAt: new Date("2026-10-06T04:30:00Z"),
      endsAt: new Date("2026-10-06T05:30:00Z"),
      sessionStatus: null,
      recordStatus: null,
    });

    expect(
      learnerAttendanceStatus(future, now),
    ).toBe("SCHEDULED");

    expect(
      summarizeLearnerAttendance(
        [
          row({
            startsAt: new Date("2026-10-01T04:30:00Z"),
            sessionStatus: "MARKED",
            recordStatus: null,
          }),
          future,
        ],
        now,
      ),
    ).toEqual({
      heldSessions: 1,
      markedSessions: 1,
      unmarkedSessions: 0,
      present: 1,
      absent: 0,
      percentage: 100,
    });
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
