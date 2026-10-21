import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter } from "next/router";
import QuizReportContent from "../QuizReportContent";
import { getQuizV2, getQuizSubmissionsV2 } from "@/api/Services/quizServices";
import { getLearnersByClass } from "@/api/Services/AdminService";
import { downloadQuizReportPdf } from "@/utils/downloadQuizReportPdf";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/quizServices", () => ({
  getQuizV2: jest.fn(),
  getQuizSubmissionsV2: jest.fn(),
}));
jest.mock("@/api/Services/AdminService", () => ({ getLearnersByClass: jest.fn() }));
jest.mock("@/utils/downloadQuizReportPdf", () => ({ downloadQuizReportPdf: jest.fn() }));

const QUIZ = {
  id: 42,
  title: "Loops Quiz",
  courseName: "Java Programming",
  lessonName: "Week 3",
  classId: 9,
  dueAt: "2026-10-01T00:00:00.000Z",
  questions: [
    { id: 1, prompt: "What does a for-loop do?", points: 5, sequence: 1 },
    { id: 2, prompt: "What is an infinite loop?", points: 5, sequence: 2 },
  ],
};

const SUBMISSIONS = [
  {
    learnerId: 1, learnerName: "Asha Rao", attemptNumber: 1, score: 10, maxScore: 10,
    submittedAt: "2026-09-20T10:00:00.000Z",
    answers: [{ questionId: 1, correct: true }, { questionId: 2, correct: true }],
  },
  {
    learnerId: 2, learnerName: "Ravi Kumar", attemptNumber: 1, score: 5, maxScore: 10,
    submittedAt: "2026-09-21T10:00:00.000Z",
    answers: [{ questionId: 1, correct: true }, { questionId: 2, correct: false }],
  },
];

const back = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ isReady: true, query: { quizId: "42" }, back });
  getQuizV2.mockResolvedValue({ data: QUIZ });
  getQuizSubmissionsV2.mockResolvedValue({ data: SUBMISSIONS });
  getLearnersByClass.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] });
});

test("loads the quiz and its submissions and renders the full report", async () => {
  render(<QuizReportContent />);

  expect(await screen.findByRole("heading", { name: "Loops Quiz" })).toBeInTheDocument();
  expect(screen.getByText("Java Programming · Week 3")).toBeInTheDocument();
  // 2 of 4 enrolled learners submitted.
  expect(screen.getByText("2/4")).toBeInTheDocument();
  expect(screen.getByText("Question accuracy")).toBeInTheDocument();
  expect(screen.getByText("What is an infinite loop?")).toBeInTheDocument();
  expect(screen.getByText("Asha Rao")).toBeInTheDocument();
  expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
});

test("clicking Download PDF calls the PDF generator with the built report", async () => {
  render(<QuizReportContent />);
  await screen.findByRole("heading", { name: "Loops Quiz" });

  fireEvent.click(screen.getByText("Download PDF"));

  await waitFor(() => expect(downloadQuizReportPdf).toHaveBeenCalledTimes(1));
  const arg = downloadQuizReportPdf.mock.calls[0][0];
  expect(arg.report.title).toBe("Loops Quiz");
  expect(arg.courseName).toBe("Java Programming");
});

test("a load failure shows an error with a retry instead of a blank or crashed page", async () => {
  getQuizV2.mockRejectedValue(new Error("Network error"));
  render(<QuizReportContent />);

  expect(await screen.findByText(/Couldn't load this quiz's report/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});

test("a roster failure keeps the report usable and marks completion totals as partial", async () => {
  getLearnersByClass.mockRejectedValue(new Error("Network error"));
  render(<QuizReportContent />);

  expect(await screen.findByRole("heading", { name: "Loops Quiz" })).toBeInTheDocument();
  expect(screen.getByText("Report is partially loaded")).toBeInTheDocument();
  expect(screen.getByText(/class roster did not/i)).toBeInTheDocument();
  expect(screen.getByText("Asha Rao")).toBeInTheDocument();
});

test("a SHARED quiz (no classId) skips the roster fetch and shows submissions without a denominator", async () => {
  getQuizV2.mockResolvedValue({ data: { ...QUIZ, classId: null } });
  render(<QuizReportContent />);

  await screen.findByRole("heading", { name: "Loops Quiz" });
  expect(getLearnersByClass).not.toHaveBeenCalled();
  // No roster denominator -- "Submitted" reads as a bare count, not "2/undefined" or similar.
  const submittedStat = document.querySelector(".ln-report-header__stat");
  expect(within(submittedStat).getByText("Submitted")).toBeInTheDocument();
  expect(within(submittedStat).getByText("2")).toBeInTheDocument();
});


test("initial load uses a report-shaped skeleton instead of a bare spinner", () => {
  getQuizV2.mockImplementation(() => new Promise(() => {}));
  getQuizSubmissionsV2.mockImplementation(() => new Promise(() => {}));
  render(<QuizReportContent />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading quiz report");
  expect(document.querySelector(".lms-skeleton-dashboard")).toBeInTheDocument();
  expect(document.querySelector(".ant-spin")).not.toBeInTheDocument();
});
