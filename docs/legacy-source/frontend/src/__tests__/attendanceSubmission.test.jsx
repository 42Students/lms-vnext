import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import TakeAttendance from "@/pages/Dashboard/course/Attendance/TakeAttendance";
import { getStudentsListbyClassid, getStudentAttendanceByDaterange, markBulkAttendance } from "@/api/Services/attendanceServices";

const mockDispatch = jest.fn();
const mockMessage = { open: jest.fn() };
const mockState = {
  loginUser: { id: 31, classId: 9, userType: "FACULTY" },
  course: {
    selectedCourseId: 5,
    selectedCourseSlug: null,
    selectedClass: { value: 77, classId: 9, startTime: "2026-01-10T09:00:00", endTime: "2026-01-10T10:00:00" },
    takeAttendanceDate: "2026-01-10",
    takeAttendanceData: [
      { learner_id: 101, first_name: "First", isAbsent: true },
      { learner_id: 102, first_name: "Second", isAbsent: false },
    ],
  },
};

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));
jest.mock("@/redux/store", () => ({
  courseAction: { handleCourseData: jest.fn(({ key, value }) => ({ type: key, payload: value })) },
}));
jest.mock("@/api/Services/attendanceServices", () => ({
  getStudentAttendanceByDaterange: jest.fn(),
  getStudentsListbyClassid: jest.fn(),
  markStudentAbsent: jest.fn(),
  markBulkAttendance: jest.fn(),
  removeStudentAbsent: jest.fn(),
  scheduleClass: jest.fn(),
}));
jest.mock("@/components/Global/Offcanvas/Attendance/SheduleClassDrawer", () => () => null);
jest.mock("@/pages/Dashboard/course/Attendance/NameWithDp", () => () => null);
jest.mock("@/pages/Dashboard/course/Attendance/AbsentPresntBtnCol", () => () => null);
jest.mock("@/components/Global/Button/button", () => function MockButton({ title, onClick, disable, disabled, loading }) {
  return <button onClick={onClick} disabled={disable || disabled}>{loading ? "Submitting…" : title}</button>;
});
jest.mock("antd", () => {
  const React = require("react");
  const actual = jest.requireActual("antd");
  const MockModal = ({ open, title, children, onOk, onCancel, confirmLoading }) => open ? (
    React.createElement("div", { role: "dialog", "aria-label": title },
      children,
      React.createElement("button", { type: "button", onClick: onCancel, disabled: confirmLoading }, "Cancel"),
      React.createElement("button", { type: "button", onClick: onOk, disabled: confirmLoading }, confirmLoading ? "Submitting…" : "Confirm")
    )
  ) : null;
  return {
    ...actual,
    Modal: MockModal,
    message: { ...actual.message, useMessage: () => [mockMessage, null] },
    Table: () => React.createElement("div", { "data-testid": "attendance-table" }),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  getStudentsListbyClassid.mockResolvedValue({ data: [] });
  getStudentAttendanceByDaterange.mockResolvedValue({ absentees: [] });
  markBulkAttendance.mockResolvedValue({ data: { markedAbsent: 1, markedPresent: 1, failed: [] } });
});

test("controlled confirmation submits the bulk API once and locks duplicate confirmation while pending", async () => {
  const request = {};
  request.promise = new Promise((resolve) => { request.resolve = resolve; });
  markBulkAttendance.mockReturnValueOnce(request.promise);

  render(<TakeAttendance />);
  expect(await screen.findByTestId("attendance-table")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Submit Attendance" }));
  expect(screen.getByRole("dialog", { name: "Submit Attendance" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(markBulkAttendance).toHaveBeenCalledTimes(1);
  expect(markBulkAttendance).toHaveBeenCalledWith({
    classScheduleId: 77,
    absentStudentIds: ["101"],
    presentStudentIds: ["102"],
    reason: "Mark Absent",
  });
  screen.getAllByRole("button", { name: "Submitting…" }).forEach((button) => expect(button).toBeDisabled());

  fireEvent.click(within(screen.getByRole("dialog", { name: "Submit Attendance" })).getByRole("button", { name: "Submitting…" }));
  expect(markBulkAttendance).toHaveBeenCalledTimes(1);

  await act(async () => {
    request.resolve({ data: { markedAbsent: 1, markedPresent: 1, failed: [] } });
    await request.promise;
  });

  expect(screen.queryByRole("dialog", { name: "Submit Attendance" })).not.toBeInTheDocument();
  expect(mockMessage.open).toHaveBeenCalledWith(expect.objectContaining({ type: "success", content: "Attendance marked successfully." }));
});

test("partial bulk failure keeps confirmation open and retries only failed learner IDs", async () => {
  markBulkAttendance
    .mockResolvedValueOnce({ data: { markedAbsent: 1, markedPresent: 0, failed: [{ studentId: "102" }] } })
    .mockResolvedValueOnce({ data: { markedAbsent: 0, markedPresent: 1, failed: [] } });

  render(<TakeAttendance />);
  await screen.findByTestId("attendance-table");

  fireEvent.click(screen.getByRole("button", { name: "Submit Attendance" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

  expect(await screen.findByText("Attendance was only partially saved")).toBeInTheDocument();
  expect(screen.getByText(/Retry (will send|sends) only the failed students/i)).toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "Submit Attendance" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(markBulkAttendance).toHaveBeenCalledTimes(2));
  expect(markBulkAttendance.mock.calls[1][0]).toEqual({
    classScheduleId: 77,
    absentStudentIds: [],
    presentStudentIds: ["102"],
    reason: "Mark Absent",
  });
});


test("attendance roster failure is retryable and never presented as no class scheduled", async () => {
  getStudentsListbyClassid.mockRejectedValueOnce(new Error("roster unavailable"));
  render(<TakeAttendance />);

  expect(await screen.findByText("Could not load the attendance roster")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  expect(screen.queryByText("No class scheduled for this date")).not.toBeInTheDocument();
});
