import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Quiztable from "@/components/Quiz/Table/table";
import { listQuizzesV2, publishQuizGradesV2 } from "@/api/Services/quizServices";

jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: () => jest.fn() }));
jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/quizServices", () => ({
  listQuizzesV2: jest.fn(),
  getQuizSubmissionsV2: jest.fn(),
  getMyQuizSubmissionsV2: jest.fn(),
  deleteQuizV2: jest.fn(),
  publishQuizGradesV2: jest.fn(),
  unpublishQuizGradesV2: jest.fn(),
}));
jest.mock("@/api/Services/courseServices", () => ({
  getFacultyProgram: jest.fn().mockResolvedValue({ data: { data: [] } }),
  getLearnerCoursesForFilter: jest.fn().mockResolvedValue({ data: { data: [] } }),
}));
jest.mock("@/components/Quiz/QuizBuilderModal", () => function MockQuizBuilderModal() { return null; });

const push = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useSelector.mockImplementation((selector) => selector({ loginUser: { id: 1, userType: "LEARNER", classId: 9 } }));
  useRouter.mockReturnValue({ query: {}, push, isReady: true });
});

// jsdom renders both the desktop table and the mobile card list at once (no real CSS media-query
// filtering), so every row's text/buttons exist twice in the DOM -- queries are scoped to the
// desktop table (.learn-quizzes-desktop) to avoid ambiguous multi-match failures, same pattern
// used elsewhere in this codebase for duplicate-render surfaces.

// #9's fix blocks OPENING an already-expired quiz on the attempt page, but the All Quizzes list
// itself gave zero warning beforehand -- a plain "Pending" status and a fully clickable
// "Start Quiz" button, so a learner had no way to tell which quiz was already dead without
// clicking through and bouncing back. Same "don't make them click to find out" fix as the
// roadmap's own "Expired" tag and the live-session join-link gate.
// A missed quiz is no longer a dead end: it opens the read-only review (questions + answer key).
test("a past-due, unsubmitted quiz shows Missed status and opens the read-only answer review", async () => {
  listQuizzesV2.mockResolvedValue({
    data: {
      content: [{
        id: 42,
        title: "Old Quiz",
        courseName: "Java Programming",
        lessonName: "Week 1",
        dueAt: "2020-01-01T00:00:00.000Z",
        submitted: false,
        attemptCount: 0,
        maxAttempts: 1,
        gradePublished: true,
      }],
      totalElements: 1,
    },
  });

  render(<Quiztable onDataLoad={() => {}} />);
  await waitFor(() => expect(document.querySelector(".learn-quizzes-desktop")).toBeInTheDocument());
  const desktop = within(document.querySelector(".learn-quizzes-desktop"));

  expect(await desktop.findByText("Missed")).toBeInTheDocument();
  // One status column: the separate "Submission" column ("Not attempted") repeated it and was removed (15 Oct 2026).
  expect(desktop.queryByText("Not attempted")).not.toBeInTheDocument();
  expect(desktop.queryByText("Pending")).not.toBeInTheDocument();
  expect(desktop.queryByRole("button", { name: "Start Quiz" })).not.toBeInTheDocument();

  const button = desktop.getByRole("button", { name: "View answers" });
  expect(button).not.toBeDisabled();
  fireEvent.click(button);
  expect(push).toHaveBeenCalledWith({
    pathname: "/quiz",
    query: { quizId: 42, contentTitle: "Old Quiz", review: "true" },
  });
});

test("a submitted quiz past its deadline offers Review attempt, never a retake, even with attempts left", async () => {
  listQuizzesV2.mockResolvedValue({
    data: {
      content: [{
        id: 45,
        title: "Retake Window Closed",
        courseName: "Java Programming",
        lessonName: "Week 4",
        dueAt: "2020-01-01T00:00:00.000Z",
        submitted: true,
        latestScore: 4,
        latestMaxScore: 10,
        attemptCount: 1,
        maxAttempts: 3,
      }],
      totalElements: 1,
    },
  });

  render(<Quiztable onDataLoad={() => {}} />);
  await waitFor(() => expect(document.querySelector(".learn-quizzes-desktop")).toBeInTheDocument());
  const desktop = within(document.querySelector(".learn-quizzes-desktop"));

  expect(await desktop.findByRole("button", { name: "Review attempt" })).toBeInTheDocument();
  expect(desktop.queryByRole("button", { name: "Retake Quiz" })).not.toBeInTheDocument();
});

test("an open submitted quiz with a retake left does not reveal the previous score", async () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  listQuizzesV2.mockResolvedValue({
    data: {
      content: [{
        id: 46,
        title: "Retake Still Open",
        courseName: "Java Programming",
        lessonName: "Week 5",
        dueAt: future,
        submitted: true,
        latestScore: 8,
        latestMaxScore: 10,
        attemptCount: 1,
        maxAttempts: 3,
        gradePublished: true,
      }],
      totalElements: 1,
    },
  });

  render(<Quiztable onDataLoad={() => {}} />);
  await waitFor(() => expect(document.querySelector(".learn-quizzes-desktop")).toBeInTheDocument());
  const desktop = within(document.querySelector(".learn-quizzes-desktop"));

  expect(await desktop.findByText("Not released")).toBeInTheDocument();
  expect(desktop.queryByText("8/10")).not.toBeInTheDocument();
  expect(desktop.getByRole("button", { name: "Retake Quiz" })).toBeInTheDocument();
});

test("a legacy published quiz with no deadline is unavailable instead of looking startable", async () => {
  listQuizzesV2.mockResolvedValue({
    data: {
      content: [{
        id: 47,
        title: "Legacy Missing Deadline",
        courseName: "Java Programming",
        lessonName: "Week 6",
        dueAt: null,
        submitted: false,
        attemptCount: 0,
        maxAttempts: 1,
        status: "PUBLISHED",
      }],
      totalElements: 1,
    },
  });

  render(<Quiztable onDataLoad={() => {}} />);
  await waitFor(() => expect(document.querySelector(".learn-quizzes-desktop")).toBeInTheDocument());
  const desktop = within(document.querySelector(".learn-quizzes-desktop"));

  // Both the status chip and the action button say Unavailable.
  expect((await desktop.findAllByText("Unavailable")).length).toBeGreaterThanOrEqual(1);
  expect(desktop.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  expect(desktop.queryByRole("button", { name: "Start Quiz" })).not.toBeInTheDocument();
});

test("a quiz that is still open shows the normal Pending status and an enabled Start Quiz button", async () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  listQuizzesV2.mockResolvedValue({
    data: {
      content: [{
        id: 43,
        title: "Upcoming Quiz",
        courseName: "Java Programming",
        lessonName: "Week 2",
        dueAt: future,
        submitted: false,
        attemptCount: 0,
        maxAttempts: 1,
      }],
      totalElements: 1,
    },
  });

  render(<Quiztable onDataLoad={() => {}} />);
  await waitFor(() => expect(document.querySelector(".learn-quizzes-desktop")).toBeInTheDocument());
  const desktop = within(document.querySelector(".learn-quizzes-desktop"));

  expect(await desktop.findByText("Pending")).toBeInTheDocument();
  expect(desktop.queryByText("Missed")).not.toBeInTheDocument();
  expect(desktop.getByRole("button", { name: "Start Quiz" })).not.toBeDisabled();
});

test("an already-submitted quiz never shows Expired, even past its due date", async () => {
  listQuizzesV2.mockResolvedValue({
    data: {
      content: [{
        id: 44,
        title: "Submitted Quiz",
        courseName: "Java Programming",
        lessonName: "Week 3",
        dueAt: "2020-01-01T00:00:00.000Z",
        submitted: true,
        latestScore: 8,
        latestMaxScore: 10,
        attemptCount: 1,
        maxAttempts: 1,
      }],
      totalElements: 1,
    },
  });

  render(<Quiztable onDataLoad={() => {}} />);
  await waitFor(() => expect(document.querySelector(".learn-quizzes-desktop")).toBeInTheDocument());
  const desktop = within(document.querySelector(".learn-quizzes-desktop"));

  // Both the Status and Submission columns render "Submitted" for a submitted quiz -- assert the
  // Status column specifically via its status-pill class, same as the other two tests check
  // ln-status--expired/ln-status--pending.
  await waitFor(() => expect(document.querySelector(".ln-status--graded")).toBeInTheDocument());
  expect(document.querySelector(".ln-status--graded")).toHaveTextContent("Submitted");
  expect(desktop.queryByText("Missed")).not.toBeInTheDocument();
});


test("a same-scope results refresh keeps the loaded quiz visible and reports refresh failure inline", async () => {
  const refreshRequest = (() => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  })();

  useSelector.mockImplementation((selector) => selector({
    loginUser: { id: 5, userType: "FACULTY", classId: 9 },
  }));
  publishQuizGradesV2.mockResolvedValue({});
  listQuizzesV2
    .mockResolvedValueOnce({
      data: {
        content: [{
          id: 77,
          title: "Refresh-safe Quiz",
          courseName: "Java Programming",
          lessonName: "Week 5",
          // Results can only be released after the deadline.
          dueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          submitted: false,
          attemptCount: 0,
          maxAttempts: 1,
          gradePublished: false,
        }],
        totalElements: 1,
      },
    })
    .mockReturnValueOnce(refreshRequest.promise);

  render(<Quiztable onDataLoad={() => {}} />);
  await waitFor(() => expect(document.querySelector(".learn-quizzes-desktop")).toBeInTheDocument());
  const desktop = within(document.querySelector(".learn-quizzes-desktop"));
  expect(await desktop.findByText("Refresh-safe Quiz")).toBeInTheDocument();

  fireEvent.click(desktop.getByRole("button", { name: /Release results/i }));
  fireEvent.click(await screen.findByRole("button", { name: "Release" }));
  await waitFor(() => expect(listQuizzesV2).toHaveBeenCalledTimes(2));

  expect(desktop.getByText("Refresh-safe Quiz")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Refreshing quizzes");

  await act(async () => {
    refreshRequest.reject(new Error("refresh failed"));
    await expect(refreshRequest.promise).rejects.toThrow("refresh failed");
  });

  expect(await screen.findByText("Couldn't refresh quizzes")).toBeInTheDocument();
  expect(desktop.getByText("Refresh-safe Quiz")).toBeInTheDocument();
});
