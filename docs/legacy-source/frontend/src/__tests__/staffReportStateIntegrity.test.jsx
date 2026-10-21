import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { downloadAssignmentReportPdf } from "@/utils/downloadAssignmentReportPdf";
import "@testing-library/jest-dom";
import { useRouter } from "next/router";
import AssignmentReportContent from "@/components/Report/AssignmentReportContent";
import QuizReportContent from "@/components/Report/QuizReportContent";
import { getAssignmentSubmissions } from "@/api/Services/courseServices";
import { getLessonContentById, getLearnersByClass } from "@/api/Services/AdminService";
import { getQuizV2, getQuizSubmissionsV2 } from "@/api/Services/quizServices";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/courseServices", () => ({ getAssignmentSubmissions: jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({
  getLessonContentById: jest.fn(),
  getLearnersByClass: jest.fn(),
}));
jest.mock("@/api/Services/quizServices", () => ({
  getQuizV2: jest.fn(),
  getQuizSubmissionsV2: jest.fn(),
}));
jest.mock("@/utils/assignmentReport", () => ({
  buildAssignmentReport: jest.fn(({ submissions, roster }) => ({
    title: "Assignment report",
    rosterSize: roster?.length ?? null,
    submittedCount: submissions.length,
    avgPercent: null,
    gradedCount: 0,
    dueDate: null,
    distribution: [],
    onTimeCount: submissions.length,
    lateCount: 0,
    notSubmitted: [],
    students: [],
  })),
}));
jest.mock("@/utils/quizReport", () => ({
  buildQuizReport: jest.fn(({ submissions, roster }) => ({
    title: "Quiz report",
    rosterSize: roster?.length ?? null,
    submittedCount: submissions.length,
    avgPercent: null,
    questionCount: 0,
    dueDate: null,
    distribution: [],
    questions: [],
    students: [],
  })),
}));
jest.mock("@/utils/downloadAssignmentReportPdf", () => ({ downloadAssignmentReportPdf: jest.fn() }));
jest.mock("@/utils/downloadQuizReportPdf", () => ({ downloadQuizReportPdf: jest.fn() }));
jest.mock("@/components/Report/ReportSummaryHeader", () => function Header({ title, onDownloadPdf }) {
  return <div data-testid="report-header">{title}<button onClick={onDownloadPdf}>Download PDF</button></div>;
});
jest.mock("@/components/Report/ScoreDistributionBars", () => function Stub() { return <div />; });
jest.mock("@/components/Report/SubmissionTimingCard", () => function Stub() { return <div />; });
jest.mock("@/components/Report/QuestionAccuracyList", () => function Stub() { return <div />; });
jest.mock("@/components/Report/ReportStudentTable", () => function Stub() { return <div />; });

beforeEach(() => {
  jest.clearAllMocks();
});

test("assignment submissions failure is an error with Retry, never a zero-submission report", async () => {
  useRouter.mockReturnValue({ isReady: true, query: { contentId: "77" }, back: jest.fn() });
  getLessonContentById.mockResolvedValue({ data: { id: 77, classId: 4, courseName: "Course" } });
  getAssignmentSubmissions.mockRejectedValue(new Error("submission service unavailable"));
  getLearnersByClass.mockResolvedValue({ data: [{ id: 1 }] });

  render(<AssignmentReportContent />);

  expect(await screen.findByText("Couldn't load this assignment's report. Please try again.")).toBeInTheDocument();
  expect(screen.queryByText("submission service unavailable")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  expect(screen.queryByTestId("report-header")).not.toBeInTheDocument();
});

test("assignment roster failure keeps valid submission metrics but labels the report partial", async () => {
  useRouter.mockReturnValue({ isReady: true, query: { contentId: "77" }, back: jest.fn() });
  getLessonContentById.mockResolvedValue({ data: { id: 77, classId: 4, courseName: "Course" } });
  getAssignmentSubmissions.mockResolvedValue({ data: [{ id: 1, learnerId: 9 }] });
  getLearnersByClass.mockRejectedValue(new Error("roster unavailable"));

  render(<AssignmentReportContent />);

  expect(await screen.findByTestId("report-header")).toHaveTextContent("Assignment report");
  expect(screen.getByText("Report is partially loaded")).toBeInTheDocument();
  expect(screen.getByText(/class roster did not/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry roster" })).toBeInTheDocument();
});

test("quiz roster failure is partial while quiz/submission failure remains decisive", async () => {
  useRouter.mockReturnValue({ isReady: true, query: { quizId: "88" }, back: jest.fn() });
  getQuizV2.mockResolvedValue({ data: { id: 88, classId: 4, courseName: "Course" } });
  getQuizSubmissionsV2.mockResolvedValue({ data: [{ id: 1, learnerId: 9 }] });
  getLearnersByClass.mockRejectedValue(new Error("roster unavailable"));

  const { unmount } = render(<QuizReportContent />);
  expect(await screen.findByTestId("report-header")).toHaveTextContent("Quiz report");
  expect(screen.getByText("Report is partially loaded")).toBeInTheDocument();
  unmount();

  jest.clearAllMocks();
  useRouter.mockReturnValue({ isReady: true, query: { quizId: "88" }, back: jest.fn() });
  getQuizV2.mockResolvedValue({ data: { id: 88, classId: 4, courseName: "Course" } });
  getQuizSubmissionsV2.mockRejectedValue(new Error("quiz submissions unavailable"));

  render(<QuizReportContent />);
  expect(await screen.findByText("Couldn't load this quiz's report. Please try again.")).toBeInTheDocument();
  expect(screen.queryByText("quiz submissions unavailable")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  expect(screen.queryByTestId("report-header")).not.toBeInTheDocument();
});

test("an incomplete assignment report asks before export and the PDF is marked incomplete (F-054/F-091)", async () => {
  useRouter.mockReturnValue({ isReady: true, query: { contentId: "77" }, back: jest.fn() });
  getLessonContentById.mockResolvedValue({ data: { id: 77, classId: 4, courseName: "Course" } });
  getAssignmentSubmissions.mockResolvedValue({ data: [{ id: 1, learnerId: 9 }] });
  getLearnersByClass.mockRejectedValue(new Error("roster unavailable"));

  render(<AssignmentReportContent />);
  await screen.findByTestId("report-header");
  fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));

  expect(downloadAssignmentReportPdf).not.toHaveBeenCalled();
  expect(await screen.findByText("This report is incomplete")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Download marked incomplete" }));
  expect(downloadAssignmentReportPdf).toHaveBeenCalledWith(expect.objectContaining({
    incompleteNote: expect.stringMatching(/class roster did not/i),
  }));
});

test("a complete assignment report downloads straight away, unmarked", async () => {
  useRouter.mockReturnValue({ isReady: true, query: { contentId: "77" }, back: jest.fn() });
  getLessonContentById.mockResolvedValue({ data: { id: 77, classId: 4, courseName: "Course" } });
  getAssignmentSubmissions.mockResolvedValue({ data: [{ id: 1, learnerId: 9 }] });
  getLearnersByClass.mockResolvedValue({ data: [{ id: 9 }] });

  render(<AssignmentReportContent />);
  await screen.findByTestId("report-header");
  fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));

  expect(downloadAssignmentReportPdf).toHaveBeenCalledWith(expect.objectContaining({ incompleteNote: undefined }));
});
