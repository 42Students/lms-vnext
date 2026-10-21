import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Attendance from "@/pages/superadmin/sections/Attendance";
import { getClassesByCollege, getCoursesByCollege } from "@/api/Services/AdminService";
import { getAdminAttendanceMonthlyGrid } from "@/api/Services/attendanceServices";
import { getAssignmentsByClass } from "@/api/Services/FacultyAssignmentService";

jest.mock("@/api/Services/AdminService", () => ({
  getClassesByCollege: jest.fn(),
  getCoursesByCollege: jest.fn(),
  adminMarkAbsent: jest.fn(),
  adminMarkPresent: jest.fn(),
  adminGetAttendanceRecord: jest.fn(),
}));
jest.mock("@/api/Services/attendanceServices", () => ({ getAdminAttendanceMonthlyGrid: jest.fn() }));
// The course picker lists the courses taught to the chosen class (class 11 -> course 22, class 33 -> course 44).
jest.mock("@/api/Services/FacultyAssignmentService", () => ({ getAssignmentsByClass: jest.fn() }));
jest.mock("@/components/admin/PolicySettingField", () => function PolicySettingFieldMock() { return null; });
jest.mock("@/utils/csvExport", () => ({ exportRowsToCsv: jest.fn() }));
jest.mock("antd", () => {
  const React = require("react");
  const actual = jest.requireActual("antd");
  return {
    ...actual,
    Select: ({ placeholder, options = [], value, onChange }) => (
      <select aria-label={placeholder} value={value ?? ""} onChange={(event) => onChange(Number(event.target.value))}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    ),
  };
});

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
const grid = (name) => ({ classes: {}, absentees: [{ studentId: 42, studentName: name, absent: [] }] });

async function selectScope(classId, courseId) {
  await waitFor(() => expect(screen.getByRole("option", { name: `Class ${classId}` })).toBeInTheDocument());
  fireEvent.change(screen.getByRole("combobox", { name: "Select class" }), { target: { value: String(classId) } });
  await waitFor(() => expect(screen.getByRole("option", { name: `Course ${courseId}` })).toBeInTheDocument());
  fireEvent.change(screen.getByRole("combobox", { name: "Select course" }), { target: { value: String(courseId) } });
}

describe("admin attendance scope and response-order safety", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClassesByCollege.mockImplementation(async (collegeId) => ({ data: { data: [
      { id: Number(collegeId) === 7 ? 11 : 33, class_name: `Class ${Number(collegeId) === 7 ? 11 : 33}` },
    ] } }));
    getCoursesByCollege.mockImplementation(async (collegeId) => ({ data: { data: [
      { id: Number(collegeId) === 7 ? 22 : 44, course_name: `Course ${Number(collegeId) === 7 ? 22 : 44}` },
    ] } }));
    getAssignmentsByClass.mockImplementation(async (classId) => ({ data: { data: [
      { course_id: Number(classId) + 11, course_name: `Course ${Number(classId) + 11}`, is_active: true },
    ] } }));
  });

  it("rejects college zero before requesting options or attendance", () => {
    render(<Attendance collegeId={0} />);
    expect(screen.getByText("Select a College to view attendance")).toBeInTheDocument();
    expect(getClassesByCollege).not.toHaveBeenCalled();
    expect(getCoursesByCollege).not.toHaveBeenCalled();
    expect(getAdminAttendanceMonthlyGrid).not.toHaveBeenCalled();
  });

  it("a class with no linked courses says so, and all college courses stay one tap away", async () => {
    getAssignmentsByClass.mockResolvedValueOnce({ data: { data: [] } });
    render(<Attendance collegeId={7} />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Class 11" })).toBeInTheDocument());
    fireEvent.change(screen.getByRole("combobox", { name: "Select class" }), { target: { value: "11" } });

    expect(await screen.findByRole("combobox", { name: "No courses linked to this class" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all college courses" }));
    expect(await screen.findByRole("option", { name: "Course 22" })).toBeInTheDocument();
  });

  it("an unreadable class-course answer is a retryable warning, not an empty course list", async () => {
    getAssignmentsByClass.mockResolvedValueOnce({ data: { data: { unexpected: true } } });
    render(<Attendance collegeId={7} />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Class 11" })).toBeInTheDocument());
    fireEvent.change(screen.getByRole("combobox", { name: "Select class" }), { target: { value: "11" } });

    expect(await screen.findByText("Couldn't verify which courses are taught to this class")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry class courses" }));
    expect(await screen.findByRole("option", { name: "Course 22" })).toBeInTheDocument();
  });

  it("does not let an older month's response overwrite the newest grid", async () => {
    const oldRequest = deferred();
    const recentRequest = deferred();
    getAdminAttendanceMonthlyGrid.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(recentRequest.promise);
    render(<Attendance collegeId={7} />);
    await selectScope(11, 22);
    await waitFor(() => expect(getAdminAttendanceMonthlyGrid).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    await waitFor(() => expect(getAdminAttendanceMonthlyGrid).toHaveBeenCalledTimes(2));
    await act(async () => { recentRequest.resolve(grid("Current learner")); await recentRequest.promise; });
    expect(await screen.findByText("Current learner")).toBeInTheDocument();
    await act(async () => { oldRequest.resolve(grid("Previous learner")); await oldRequest.promise; });
    expect(screen.getByText("Current learner")).toBeInTheDocument();
    expect(screen.queryByText("Previous learner")).not.toBeInTheDocument();
  });

  it("resets college-specific selections and ignores a previous college's late response", async () => {
    const oldRequest = deferred();
    getAdminAttendanceMonthlyGrid.mockReturnValueOnce(oldRequest.promise).mockResolvedValueOnce(grid("New college learner"));
    const view = render(<Attendance collegeId={7} />);
    await selectScope(11, 22);
    await waitFor(() => expect(getAdminAttendanceMonthlyGrid).toHaveBeenCalledTimes(1));
    view.rerender(<Attendance collegeId={8} />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Class 33" })).toBeInTheDocument());
    expect(screen.getByRole("combobox", { name: "Select class" }).value).toBe("");
    expect(screen.getByRole("combobox", { name: "Select course" }).value).toBe("");
    expect(getAdminAttendanceMonthlyGrid).toHaveBeenCalledTimes(1);
    await act(async () => { oldRequest.resolve(grid("Old college learner")); await oldRequest.promise; });
    expect(screen.queryByText("Old college learner")).not.toBeInTheDocument();
    await selectScope(33, 44);
    await waitFor(() => expect(getAdminAttendanceMonthlyGrid).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("New college learner")).toBeInTheDocument();
  });
});
