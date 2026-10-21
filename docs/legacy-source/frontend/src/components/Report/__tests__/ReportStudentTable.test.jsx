import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReportStudentTable from "../ReportStudentTable";

test("treats malformed student payloads as empty instead of crashing", () => {
  const { rerender } = render(<ReportStudentTable students={null} emptyMessage="No students yet." />);
  expect(screen.getByText("No students yet.")).toBeInTheDocument();

  rerender(<ReportStudentTable students={{ broken: true }} emptyMessage="No students yet." />);
  expect(screen.getByText("No students yet.")).toBeInTheDocument();
});

test("filters invalid rows and renders a safe fallback name", () => {
  render(
    <ReportStudentTable
      students={[
        null,
        "broken",
        { id: 7, name: "", percent: 75, score: 3, maxScore: 4 },
        { id: 8, name: "Asha", percent: null },
      ]}
    />
  );

  expect(screen.getByText("Unnamed student")).toBeInTheDocument();
  expect(screen.getByText("Asha")).toBeInTheDocument();
  expect(screen.queryByText("broken")).not.toBeInTheDocument();
});
