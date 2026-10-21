import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter } from "next/router";
import AssignmentReportContent from "../AssignmentReportContent";
import { getAssignmentSubmissions } from "@/api/Services/courseServices";
import { getLessonContentById, getLearnersByClass } from "@/api/Services/AdminService";
import { downloadAssignmentReportPdf } from "@/utils/downloadAssignmentReportPdf";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/courseServices", () => ({ getAssignmentSubmissions: jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({
  getLessonContentById: jest.fn(),
  getLearnersByClass: jest.fn(),
}));
jest.mock("@/utils/downloadAssignmentReportPdf", () => ({ downloadAssignmentReportPdf: jest.fn() }));

const ASSIGNMENT = {
  id: 77,
  contentTitle: "Week 2 Homework",
  courseName: "Java Programming",
  classId: 9,
  contentDataDTO: { due_date: "2026-09-20T18:00:00.000Z", points: 20 },
};

const SUBMISSIONS = [
  { studentId: 1, studentFirstName: "Asha", studentLastName: "Rao", points: 20, pointsObtained: 18, graded: 1, createdAt: "2026-09-19T10:00:00.000Z" },
];

const ROSTER = [{ learnerId: 1, firstName: "Asha", lastName: "Rao" }, { learnerId: 2, firstName: "Ravi", lastName: "Kumar" }];

const back = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ isReady: true, query: { contentId: "77" }, back });
  getLessonContentById.mockResolvedValue({ data: ASSIGNMENT });
  getAssignmentSubmissions.mockResolvedValue({ data: SUBMISSIONS });
  getLearnersByClass.mockResolvedValue({ data: ROSTER });
});

test("loads the assignment and its submissions and renders the full report", async () => {
  render(<AssignmentReportContent />);

  expect(await screen.findByRole("heading", { name: "Week 2 Homework" })).toBeInTheDocument();
  expect(screen.getByText("Java Programming")).toBeInTheDocument();
  expect(screen.getByText("1/2")).toBeInTheDocument(); // 1 of 2 enrolled submitted
  expect(screen.getByText("Submission timing")).toBeInTheDocument();
  expect(screen.getByText("Asha Rao")).toBeInTheDocument();
  expect(screen.getByText("Hasn't submitted (1)")).toBeInTheDocument();
  expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
});

test("clicking Download PDF calls the PDF generator with the built report", async () => {
  render(<AssignmentReportContent />);
  await screen.findByRole("heading", { name: "Week 2 Homework" });

  fireEvent.click(screen.getByText("Download PDF"));

  await waitFor(() => expect(downloadAssignmentReportPdf).toHaveBeenCalledTimes(1));
  expect(downloadAssignmentReportPdf.mock.calls[0][0].report.title).toBe("Week 2 Homework");
});

test("a load failure shows an error with a retry instead of a blank or crashed page", async () => {
  getLessonContentById.mockRejectedValue(new Error("Network error"));
  render(<AssignmentReportContent />);

  expect(await screen.findByText(/Couldn't load this assignment's report/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});

test("a failed submissions fetch is an error with Retry, never a false 'no one has submitted'", async () => {
  getAssignmentSubmissions.mockRejectedValueOnce(new Error("Network error"));
  render(<AssignmentReportContent />);

  expect(await screen.findByText(/Couldn't load this assignment's report/)).toBeInTheDocument();
  expect(screen.queryByText("No one has submitted this assignment yet.")).not.toBeInTheDocument();
  expect(screen.queryByText(/Network error/)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("heading", { name: "Week 2 Homework" })).toBeInTheDocument();
});

test("a roster failure keeps usable submission data but warns that completion totals are partial", async () => {
  getLearnersByClass.mockRejectedValue(new Error("Network error"));
  render(<AssignmentReportContent />);

  expect(await screen.findByRole("heading", { name: "Week 2 Homework" })).toBeInTheDocument();
  expect(screen.getByText("Report is partially loaded")).toBeInTheDocument();
  expect(screen.getByText(/class roster did not/i)).toBeInTheDocument();
  expect(screen.getByText("Asha Rao")).toBeInTheDocument();
});

test("a server explanation is shown with the plain sentence", async () => {
  getAssignmentSubmissions.mockRejectedValueOnce({ response: { data: { message: "You can't see this class's submissions" } } });
  render(<AssignmentReportContent />);

  expect(await screen.findByText("Couldn't load this assignment's report: You can't see this class's submissions")).toBeInTheDocument();
});

test("requests every page of submissions, not the 50-row legacy cap or a single 100-row page (F-052)", async () => {
  render(<AssignmentReportContent />);
  await screen.findByRole("heading", { name: "Week 2 Homework" });

  expect(getAssignmentSubmissions).toHaveBeenCalledWith({ lessonContentId: 77, all: true });
});

test("unwraps a paged { content: [...] } response the same way a plain array response is handled", async () => {
  // AssignmentController#fetchSubmissions returns a Spring Page (content/totalElements/...) once
  // page+size are both supplied, not a plain array -- this must be unwrapped the same way
  // viewSubmissionsModal.jsx's own unwrapSubmissions already does.
  getAssignmentSubmissions.mockResolvedValue({ data: { content: SUBMISSIONS, totalElements: 1, totalPages: 1 } });
  render(<AssignmentReportContent />);

  expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
  expect(screen.getByText("1/2")).toBeInTheDocument();
});


test("initial load uses a report-shaped skeleton instead of a bare spinner", () => {
  getLessonContentById.mockImplementation(() => new Promise(() => {}));
  render(<AssignmentReportContent />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading assignment report");
  expect(document.querySelector(".lms-skeleton-dashboard")).toBeInTheDocument();
  expect(document.querySelector(".ant-spin")).not.toBeInTheDocument();
});
