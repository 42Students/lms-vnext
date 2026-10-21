import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import TeacherAttendanceView from "@/pages/Dashboard/course/Attendance/TeacherAttendanceView";
import { getStudentAttendanceByDaterange } from "@/api/Services/attendanceServices";

// jspdf ships an ESM-only build that Jest's default transformIgnorePatterns won't transform,
// so importing it transitively (via downloadMonthlyAttendancePdf.js) crashes every test in this
// file with "Cannot use import statement outside a module." The PDF generation itself is
// covered directly by monthlyAttendanceReport.test.js's pure-data-builder tests instead.
jest.mock("@/utils/downloadMonthlyAttendancePdf", () => ({
  downloadMonthlyAttendancePdf: jest.fn(),
}));

const mockDispatch = jest.fn();
const mockState = {
  loginUser: { id: 11, classId: 9, userType: "FACULTY" },
  course: {
    selectedCourseId: 3,
    selectedCourseSlug: null,
    attendeeCurMonth: "2026-09-01",
    attendeeOrgData: { classes: {}, absentees: [] },
  },
};

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));
jest.mock("@/api/Services/attendanceServices", () => ({ getStudentAttendanceByDaterange: jest.fn() }));
jest.mock("@/redux/store", () => ({
  courseAction: { handleCourseData: jest.fn(({ key, value }) => ({ type: key, payload: value })) },
}));
jest.mock("@/components/Global/Tooltips/CustomToolTipTable", () => () => null);
jest.mock("@/pages/Dashboard/course/Attendance/TakeAttendance", () => () => null);

beforeEach(() => {
  jest.clearAllMocks();
  mockState.course.attendeeOrgData = { classes: {}, absentees: [] };
});

test("renders a loaded attendance table instead of waiting forever for removed stuNames state", async () => {
  getStudentAttendanceByDaterange.mockResolvedValue({ classes: {}, absentees: [] });
  render(<TeacherAttendanceView isTakeAttendance={false} />);
  await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
  expect(screen.getByText("Student Name")).toBeInTheDocument();
  expect(getStudentAttendanceByDaterange).toHaveBeenCalledWith(expect.objectContaining({ classId: 9, courseId: 3, facultyId: 11 }));
});

test("first attendance response renders after an initially empty Redux state without a temporal-dead-zone error", async () => {
  mockState.course.attendeeOrgData = null;
  const result = { classes: {}, absentees: [{ studentId: 21, studentName: "Student One", absent: [] }] };
  getStudentAttendanceByDaterange.mockResolvedValue(result);
  mockDispatch.mockImplementation((action) => {
    if (action.type === "attendeeOrgData") mockState.course.attendeeOrgData = action.payload;
  });
  // First render returns early, before the table's render-only clock is initialized.
  const view = render(<TeacherAttendanceView isTakeAttendance={true} />);
  await waitFor(() => expect(mockState.course.attendeeOrgData).toBe(result));
  view.rerender(<TeacherAttendanceView isTakeAttendance={false} />);
  expect(await screen.findByRole("table")).toBeInTheDocument();
  expect(screen.getByText("Student One")).toBeInTheDocument();
});

test("failed attendance requests show a retry rather than reporting an empty month", async () => {
  mockState.course.attendeeOrgData = null;
  getStudentAttendanceByDaterange.mockRejectedValue(new Error("Network unavailable"));
  render(<TeacherAttendanceView isTakeAttendance={false} />);
  expect(await screen.findByText("Couldn't load attendance data for this month.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});

// A held (already-started) class with attendanceMarked: false has no Attend rows for anyone --
// exactly the same shape as a held class where every student happened to be present -- so before
// the attendanceMarked flag existed, this always rendered as "Present" for everyone the instant a
// class was scheduled, even with zero faculty interaction. See ClassSchedule.attendanceMarkedAt /
// AttendanceBulkController#markBulk on the backend.
test("a held class with no attendance submission yet shows Not Marked, not Present", async () => {
  mockState.course.attendeeOrgData = null;
  const result = {
    classes: {
      "05": [{ Id: 501, startTime: "2026-09-05 09:00:00", endTime: "2026-09-05 10:00:00", attendanceMarked: false }],
    },
    absentees: [{ studentId: 21, studentName: "Student One", absent: [] }],
  };
  getStudentAttendanceByDaterange.mockResolvedValue(result);
  mockDispatch.mockImplementation((action) => {
    if (action.type === "attendeeOrgData") mockState.course.attendeeOrgData = action.payload;
  });
  render(<TeacherAttendanceView isTakeAttendance={false} />);
  await waitFor(() => expect(mockState.course.attendeeOrgData).toBe(result));
  expect(await screen.findByLabelText("Not marked yet")).toBeInTheDocument();
  expect(screen.queryByLabelText("Present")).not.toBeInTheDocument();
  expect(screen.getByText("Not marked")).toBeInTheDocument();
});

// "Active days" (the grid header stat) used to count a day with only a not-yet-held session as
// active, while the grid right below it treats that exact same day as "No class" -- see the isHeld
// filter in createAggregateAttendanceView, which is deliberate (a future session can never appear
// in a student's `absent` list yet). The two disagreeing about whether the same day is "active"
// is exactly the kind of thing #14's audit was asked to check.
test("Active days only counts days that have actually happened, matching what the grid itself shows", async () => {
  // This test's "today" must be pinned, not read from the real clock — day 30's "hasn't happened
  // yet" premise silently broke the moment real wall-clock time actually reached the 30th.
  jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date("2026-09-29T12:00:00Z"));
  mockState.course.attendeeOrgData = null;
  const result = {
    classes: {
      // Pinned "today" is 2026-09-29 -- day 05 already happened, day 30 hasn't yet.
      "05": [{ Id: 501, startTime: "2026-09-05 09:00:00", endTime: "2026-09-05 10:00:00", attendanceMarked: true }],
      "30": [{ Id: 502, startTime: "2026-09-30 09:00:00", endTime: "2026-09-30 10:00:00", attendanceMarked: false }],
    },
    absentees: [{ studentId: 21, studentName: "Student One", absent: [] }],
  };
  getStudentAttendanceByDaterange.mockResolvedValue(result);
  mockDispatch.mockImplementation((action) => {
    if (action.type === "attendeeOrgData") mockState.course.attendeeOrgData = action.payload;
  });
  try {
    render(<TeacherAttendanceView isTakeAttendance={false} />);
    await waitFor(() => expect(mockState.course.attendeeOrgData).toBe(result));
    await screen.findByRole("table");

    // Only day 05 (already held) should count -- day 30 hasn't happened yet.
    const activeDaysLabel = screen.getByText("Active days");
    expect(activeDaysLabel.closest("span").querySelector("strong")).toHaveTextContent("1");
  } finally {
    jest.useRealTimers();
  }
});
