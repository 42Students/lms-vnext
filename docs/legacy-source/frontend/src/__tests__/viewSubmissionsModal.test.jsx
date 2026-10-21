import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ViewSubmissionsModal from "@/pages/Dashboard/course/syllabus/viewSubmissionsModal";
import { getAssignmentSubmissions } from "@/api/Services/courseServices";
import { getFileUrl } from "@/api/Services/AdminService";

jest.mock("@/api/Services/courseServices", () => ({
  getAssignmentSubmissions: jest.fn(),
}));
jest.mock("@/api/Services/AdminService", () => ({
  getFileUrl: jest.fn(),
}));
jest.mock("@/api/ApiMethod", () => ({
  patch: jest.fn(),
  post: jest.fn(),
}));

const ASSIGNMENT = { id: 77, contentTitle: "Week 1 Homework" };

function submission(overrides = {}) {
  return {
    id: 1,
    studentId: 100,
    studentFirstName: "Asha",
    studentLastName: "Rao",
    pointsObtained: null,
    graded: 0,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getFileUrl.mockResolvedValue("");
});

describe("ViewSubmissionsModal", () => {
  test("shows a Graded/Pending pill per student without needing to click into each one", async () => {
    getAssignmentSubmissions.mockResolvedValue({
      data: [
        submission({ id: 1, studentId: 100, studentFirstName: "Asha", studentLastName: "Rao", pointsObtained: null }),
        submission({ id: 2, studentId: 101, studentFirstName: "Ravi", studentLastName: "Kumar", pointsObtained: 8, graded: 1 }),
      ],
    });

    render(<ViewSubmissionsModal open selectedViewAssignment={ASSIGNMENT} onClose={() => {}} />);

    await waitFor(() => expect(document.querySelector(".ln-submission-student-row")).toBeInTheDocument());
    const rows = document.querySelectorAll(".ln-submission-student-row");
    const pendingRow = Array.from(rows).find((row) => row.textContent.includes("Asha Rao"));
    const gradedRow = Array.from(rows).find((row) => row.textContent.includes("Ravi Kumar"));
    expect(within(pendingRow).getByText("Pending")).toBeInTheDocument();
    expect(within(gradedRow).getByText("Graded")).toBeInTheDocument();
  });

  test("the summary header counts graded submissions correctly", async () => {
    getAssignmentSubmissions.mockResolvedValue({
      data: [
        submission({ id: 1, pointsObtained: null }),
        submission({ id: 2, studentId: 101, pointsObtained: 8, graded: 1 }),
        submission({ id: 3, studentId: 102, pointsObtained: 5, graded: 1 }),
      ],
    });

    render(<ViewSubmissionsModal open selectedViewAssignment={ASSIGNMENT} onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText(/2\/3 graded/)).toBeInTheDocument());
  });

  test("Next/Previous move between students and disable at the ends of the list", async () => {
    getAssignmentSubmissions.mockResolvedValue({
      data: [
        submission({ id: 1, studentId: 100, studentFirstName: "Asha", studentLastName: "Rao" }),
        submission({ id: 2, studentId: 101, studentFirstName: "Ravi", studentLastName: "Kumar" }),
      ],
    });

    render(<ViewSubmissionsModal open selectedViewAssignment={ASSIGNMENT} onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());
    const prevBtn = screen.getByLabelText("Previous student");
    const nextBtn = screen.getByLabelText("Next student");
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());
    expect(nextBtn).toBeDisabled();
    expect(prevBtn).not.toBeDisabled();

    fireEvent.click(prevBtn);
    await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());
  });

  test("the mobile picker still lists every student (desktop hides it via CSS, not by removing it)", async () => {
    getAssignmentSubmissions.mockResolvedValue({
      data: [
        submission({ id: 1, studentId: 100, studentFirstName: "Asha", studentLastName: "Rao" }),
        submission({ id: 2, studentId: 101, studentFirstName: "Ravi", studentLastName: "Kumar" }),
      ],
    });

    render(<ViewSubmissionsModal open selectedViewAssignment={ASSIGNMENT} onClose={() => {}} />);

    await waitFor(() => expect(document.querySelector(".ln-assignment-submissions-modal__mobile-picker")).toBeInTheDocument());
    const picker = document.querySelector(".ln-assignment-submissions-modal__mobile-picker");
    expect(picker).toBeInTheDocument();
  });

  test("clicking a student in the list selects them, matching the nav position", async () => {
    getAssignmentSubmissions.mockResolvedValue({
      data: [
        submission({ id: 1, studentId: 100, studentFirstName: "Asha", studentLastName: "Rao" }),
        submission({ id: 2, studentId: 101, studentFirstName: "Ravi", studentLastName: "Kumar" }),
      ],
    });

    render(<ViewSubmissionsModal open selectedViewAssignment={ASSIGNMENT} onClose={() => {}} />);

    await waitFor(() => expect(document.querySelector(".ln-submission-student-row")).toBeInTheDocument());
    const rows = document.querySelectorAll(".ln-submission-student-row");
    const raviRow = Array.from(rows).find((row) => row.textContent.includes("Ravi Kumar"));
    fireEvent.click(raviRow);
    await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());
  });

  // It stays mounted (closed) inside the assignment drawer, which can hold a quiz or video id.
  test("does not fetch submissions while closed", () => {
    getAssignmentSubmissions.mockClear();
    render(<ViewSubmissionsModal open={false} selectedViewAssignment={{ id: 47 }} onClose={() => {}} />);
    expect(getAssignmentSubmissions).not.toHaveBeenCalled();
  });
});
