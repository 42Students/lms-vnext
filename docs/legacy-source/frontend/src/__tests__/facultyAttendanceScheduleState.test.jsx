import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TakeAttendanceHeaderFilters from "@/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters";
import { getClassSheduleByDaterange } from "@/api/Services/attendanceServices";

// Jest has no CSS transform; the component's SCSS module only supplies class names.
jest.mock("@/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.module.scss", () => ({}));

const mockDispatch = jest.fn();
const state = {
  loginUser: { id: 31, classId: 9 },
  course: {
    selectedClass: null,
    takeAttendanceDate: "2026-10-06",
    selectedCourseSlug: null,
    selectedCourseId: 5,
    scheduleRefreshKey: 0,
  },
};

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(state),
}));
jest.mock("@/redux/store", () => ({
  courseAction: { handleCourseData: jest.fn(({ key, value }) => ({ type: key, payload: value })) },
}));
jest.mock("@/api/Services/attendanceServices", () => ({
  getClassSheduleByDaterange: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("schedule request failure is retryable and never labelled as no classes scheduled", async () => {
  getClassSheduleByDaterange.mockRejectedValueOnce(new Error("schedule service unavailable"));
  render(<TakeAttendanceHeaderFilters />);

  expect(await screen.findByText("Class schedules unavailable")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Class schedules unavailable" })).toBeDisabled();
  expect(screen.queryByText("No classes scheduled")).not.toBeInTheDocument();
});
