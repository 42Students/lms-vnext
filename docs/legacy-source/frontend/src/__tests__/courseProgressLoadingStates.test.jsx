import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CourseProgress from "@/pages/superadmin/sections/CourseProgress";
import {
  fetchWithErrorHandling,
  getCoursesByCollege,
  getClassesByCollege,
  getCourseProgress,
} from "@/api/Services/AdminService";
import { getAssignmentsByClass } from "@/api/Services/FacultyAssignmentService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(),
  getCoursesByCollege: jest.fn(),
  getClassesByCollege: jest.fn(),
  getCourseProgress: jest.fn(),
}));
jest.mock("@/api/Services/FacultyAssignmentService", () => ({
  getAssignmentsByClass: jest.fn(),
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

// fetchWithErrorHandling receives the request promise (older callers passed a thunk).
const metadata = async (call) => ({ success: true, data: await (typeof call === "function" ? call() : call) });

beforeEach(() => {
  jest.clearAllMocks();
  getCoursesByCollege.mockResolvedValue({ data: [{ id: 11, courseName: "Java" }] });
  getClassesByCollege.mockResolvedValue({ data: [{ id: 22, className: "CSE A" }] });
  fetchWithErrorHandling.mockImplementation(metadata);
  getAssignmentsByClass.mockResolvedValue({ data: { data: [{ courseId: 11, courseName: "Java", isActive: true }] } });
  getCourseProgress.mockResolvedValue({
    data: { data: {
      averagePercent: 50,
      learnerCount: 1,
      notStartedCount: 0,
      measuredItemCount: 2,
      assignmentCount: 1,
      quizCount: 1,
      learners: [{ learnerId: 7, name: "Asha", percent: 50 }],
    } },
  });
});

async function selectScope() {
  await waitFor(() => expect(getCoursesByCollege).toHaveBeenCalled());
  // The class picker stays disabled until the filter metadata has loaded.
  await waitFor(() => expect(document.querySelector(".ant-select")).not.toHaveClass("ant-select-disabled"));
  fireEvent.mouseDown(screen.getByText("Class"));
  fireEvent.click(await screen.findByText("CSE A"));
  await waitFor(() => expect(getAssignmentsByClass).toHaveBeenCalledWith(22));
  fireEvent.mouseDown(screen.getByText("Course"));
  fireEvent.click(await screen.findByText("Java"));
}

test("uses shape-aware loading for a newly selected course instead of stale data or card spinner", async () => {
  const progress = deferred();
  getCourseProgress.mockReturnValueOnce(progress.promise);
  render(<CourseProgress collegeId={1} />);
  await selectScope();

  await waitFor(() => expect(getCourseProgress).toHaveBeenCalledWith(11, 22));
  expect(screen.getByRole("status", { name: /loading course progress summary/i })).toBeInTheDocument();
  expect(document.querySelector(".ant-card-loading-content")).not.toBeInTheDocument();

  await act(async () => {
    progress.resolve({
      data: { data: {
        averagePercent: 50, learnerCount: 1, notStartedCount: 0,
        measuredItemCount: 2, assignmentCount: 1, quizCount: 1,
        learners: [{ learnerId: 7, name: "Asha", percent: 50 }],
      } },
    });
    await progress.promise;
  });

  expect(await screen.findByText("Asha")).toBeInTheDocument();
});

test("same-scope refresh failure keeps loaded progress visible with an inline retry", async () => {
  render(<CourseProgress collegeId={1} />);
  await selectScope();
  expect(await screen.findByText("Asha")).toBeInTheDocument();

  getCourseProgress.mockRejectedValueOnce(new Error("temporary failure"));
  fireEvent.click(screen.getByRole("button", { name: /Refresh/ }));

  expect(screen.getByText("Asha")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("Couldn't refresh course progress")).toBeInTheDocument());
  expect(screen.getByText("Showing the last progress loaded for this class and course.")).toBeInTheDocument();
});

test("college switch clears the old class/course scope before new metadata arrives", async () => {
  const nextCourses = deferred();
  const nextClasses = deferred();
  let college = 1;
  getCoursesByCollege.mockImplementation((collegeId) => collegeId === 2 ? nextCourses.promise : Promise.resolve({ data: [{ id: 11, courseName: "Java" }] }));
  getClassesByCollege.mockImplementation((collegeId) => collegeId === 2 ? nextClasses.promise : Promise.resolve({ data: [{ id: 22, className: "CSE A" }] }));

  const view = render(<CourseProgress collegeId={college} />);
  await selectScope();
  expect(await screen.findByText("Asha")).toBeInTheDocument();

  college = 2;
  view.rerender(<CourseProgress collegeId={college} />);

  expect(screen.queryByText("Asha")).not.toBeInTheDocument();
  expect(screen.getByText("Pick a class, then one of its courses.")).toBeInTheDocument();
});

// BE-0131: the filter warning has a working Retry.
test("a failed filter lookup offers Retry, and Retry loads the filters again", async () => {
  fetchWithErrorHandling
    .mockImplementationOnce(async () => ({ success: false }))
    .mockImplementationOnce(metadata);
  render(<CourseProgress collegeId={1} />);
  expect(await screen.findByTestId("course-progress-metadata-error")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Retry"));
  await waitFor(() => expect(screen.queryByTestId("course-progress-metadata-error")).toBeNull());
  expect(getCoursesByCollege).toHaveBeenCalledTimes(2);
});

// BE-0132: if the class's own courses can't be loaded, no course is offered (the college's list would allow refused pairs).
test("a failed class-course lookup offers no course and a Retry", async () => {
  getAssignmentsByClass.mockRejectedValueOnce(new Error("500"));
  render(<CourseProgress collegeId={1} />);
  await waitFor(() => expect(document.querySelector(".ant-select")).not.toHaveClass("ant-select-disabled"));
  fireEvent.mouseDown(screen.getByText("Class"));
  fireEvent.click(await screen.findByText("CSE A"));
  expect(await screen.findByTestId("course-progress-class-courses-error")).toBeInTheDocument();
  expect(screen.getByText("Couldn't load this class's courses")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Retry"));
  await waitFor(() => expect(screen.queryByTestId("course-progress-class-courses-error")).toBeNull());
  expect(getAssignmentsByClass).toHaveBeenCalledTimes(2);
});
