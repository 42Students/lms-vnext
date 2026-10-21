import React from "react";
import { render, waitFor } from "@testing-library/react";
import { useSelector, useDispatch } from "react-redux";
import AttendanceContent from "@/components/Attendance/AttendanceContent";
import { getLearnerAttendanceCourses, getLearnerAttendanceRecords } from "@/api/Services/attendanceServices";

jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn(), push: jest.fn(), pathname: "/learner/attendance", query: {} }) }));
jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: jest.fn() }));
jest.mock("@/api/Services/attendanceServices", () => ({ getLearnerAttendanceCourses: jest.fn(), getLearnerAttendanceRecords: jest.fn() }));
jest.mock("@/redux/store", () => ({ attendanceAction: { handleStudentData: (p) => ({ type: "student", payload: p }) } }));

const dispatch = jest.fn();
function withState(selectedCourse) {
  const state = { loginUser: { userType: "LEARNER", id: 1 }, attendance: { studentData: { selectedCourse } } };
  useSelector.mockImplementation((fn) => fn(state));
}

beforeEach(() => {
  jest.clearAllMocks();
  useDispatch.mockReturnValue(dispatch);
  getLearnerAttendanceRecords.mockResolvedValue({ records: [] });
});

// BE-0001: a remembered course that left the learner's list is replaced, and never requested.
test("a stale remembered course is replaced by the first current course and is not requested", async () => {
  withState({ id: 77, label: "Old course" });
  getLearnerAttendanceCourses.mockResolvedValue([{ id: 5, label: "Current course" }]);
  render(<AttendanceContent />);
  await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: "student", payload: { key: "selectedCourse", value: { id: 5, label: "Current course" } } }));
  expect(getLearnerAttendanceRecords).not.toHaveBeenCalledWith(expect.objectContaining({ courseId: 77 }));
});

test("a still-valid remembered course is kept and its records load", async () => {
  withState({ id: 5, label: "Current course" });
  getLearnerAttendanceCourses.mockResolvedValue([{ id: 5, label: "Current course" }, { id: 6, label: "Other" }]);
  render(<AttendanceContent />);
  await waitFor(() => expect(getLearnerAttendanceRecords).toHaveBeenCalledWith(expect.objectContaining({ courseId: 5 })));
  expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({ key: "selectedCourse" }) }));
});
