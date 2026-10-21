import { buildMonthlyAttendanceReport } from "../monthlyAttendanceReport";

// A fixed "now" well after every session below, so isHeldClassSession treats them all as held.
const NOW = new Date("2026-03-31T12:00:00");
const MONTH = new Date("2026-03-01T00:00:00");

function session(id, day, { marked = true } = {}) {
  return { Id: id, classScheduleId: id, startTime: `2026-03-${day}T09:00:00`, attendanceMarked: marked };
}

describe("buildMonthlyAttendanceReport", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  test("marks a day Present when the student isn't in that session's absent list", () => {
    const attendeeOrgData = {
      classes: { "05": [session(1, "05")] },
      absentees: [{ studentId: 1, studentName: "Asha Rao", absent: [] }],
    };
    const report = buildMonthlyAttendanceReport(attendeeOrgData, MONTH);
    const day5 = report.students[0].daily.find((d) => d.day === 5);
    expect(day5.status).toBe("P");
    expect(report.students[0].present).toBe(1);
    expect(report.students[0].absent).toBe(0);
  });

  test("marks a day Absent when the student's id is in that session's absent list", () => {
    const attendeeOrgData = {
      classes: { "05": [session(1, "05")] },
      absentees: [{ studentId: 1, studentName: "Asha Rao", absent: [1] }],
    };
    const report = buildMonthlyAttendanceReport(attendeeOrgData, MONTH);
    const day5 = report.students[0].daily.find((d) => d.day === 5);
    expect(day5.status).toBe("A");
    expect(report.students[0].absent).toBe(1);
  });

  test("a session with no attendanceMarked submission is Not marked, not silently Present", () => {
    const attendeeOrgData = {
      classes: { "05": [session(1, "05", { marked: false })] },
      absentees: [{ studentId: 1, studentName: "Asha Rao", absent: [] }],
    };
    const report = buildMonthlyAttendanceReport(attendeeOrgData, MONTH);
    const day5 = report.students[0].daily.find((d) => d.day === 5);
    expect(day5.status).toBe("N");
    expect(report.students[0].notMarked).toBe(1);
    // Not-marked sessions must not count toward the attendance percentage denominator.
    expect(report.students[0].percent).toBeNull();
  });

  test("a day with no scheduled session at all is No class (X), never counted", () => {
    const attendeeOrgData = { classes: {}, absentees: [{ studentId: 1, studentName: "Asha Rao", absent: [] }] };
    const report = buildMonthlyAttendanceReport(attendeeOrgData, MONTH);
    expect(report.students[0].daily.every((d) => d.status === "X")).toBe(true);
    expect(report.students[0].present + report.students[0].absent + report.students[0].notMarked).toBe(0);
  });

  test("missing even one session on a multi-session day rolls the whole day up as Absent", () => {
    const attendeeOrgData = {
      classes: { "05": [session(1, "05"), session(2, "05")] },
      absentees: [{ studentId: 1, studentName: "Asha Rao", absent: [2] }],
    };
    const report = buildMonthlyAttendanceReport(attendeeOrgData, MONTH);
    const day5 = report.students[0].daily.find((d) => d.day === 5);
    expect(day5.status).toBe("A");
  });

  test("percent and belowThreshold reflect only marked (present+absent) sessions", () => {
    const attendeeOrgData = {
      classes: { "01": [session(1, "01")], "02": [session(2, "02")], "03": [session(3, "03")] },
      absentees: [{ studentId: 1, studentName: "Asha Rao", absent: [2, 3] }],
    };
    const report = buildMonthlyAttendanceReport(attendeeOrgData, MONTH);
    const student = report.students[0];
    expect(student.present).toBe(1);
    expect(student.absent).toBe(2);
    expect(student.percent).toBe(33);
    expect(student.belowThreshold).toBe(true);
  });
});
