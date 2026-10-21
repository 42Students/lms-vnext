import React from "react";
import { render, screen } from "@testing-library/react";
import SubmissionWork, { gradingLabel, isLateSubmission } from "@/components/admin/SubmissionWork";

jest.mock("@/api/Services/AdminService", () => ({ getFileUrl: jest.fn() }));

describe("admin grading popup shows what was handed in", () => {
  test("file, written answer, attachment link and late tag", () => {
    render(<SubmissionWork
      assignment={{ courseId: 3, classId: 9, deadline: [2026, 10, 1, 23, 59] }}
      submission={{
        studentId: 161,
        createdAt: [2026, 10, 3, 5, 0, 0],
        fileDTO: { cloud_storage_object: "submissions/a.pdf", original_name: "answers.pdf" },
        htmlContent: "<p>My written answer</p>",
        submissionAssets: [{ id: "x", title: "Repo", link: "https://github.com/x/y" }],
      }} />);
    expect(screen.getByText("answers.pdf")).toBeInTheDocument();
    expect(screen.getByText("My written answer")).toBeInTheDocument();
    expect(screen.getByText("Repo")).toBeInTheDocument();
    expect(screen.getByText("Late")).toBeInTheDocument();
  });

  test("empty submission says so; on-time is not late", () => {
    render(<SubmissionWork assignment={{}} submission={{}} />);
    expect(screen.getByText("Nothing attached to this submission.")).toBeInTheDocument();
    expect(isLateSubmission({ createdAt: [2026, 10, 1, 5, 0] }, [2026, 10, 1, 23, 59])).toBe(false);
  });

  test("plain status names", () => {
    expect(gradingLabel("NOT_GRADED")).toBe("Not graded");
    expect(gradingLabel("MANUALLY_GRADED")).toBe("Graded, not published");
  });
});
