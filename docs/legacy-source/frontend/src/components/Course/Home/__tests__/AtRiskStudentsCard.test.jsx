import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AtRiskStudentsCard from "../AtRiskStudentsCard";

function student(overrides = {}) {
  return {
    studentId: 1,
    name: "Asha Rao",
    reasons: ["45% attendance"],
    severity: 3,
    ...overrides,
  };
}

test("shows a calm, named success state when nobody is at risk", () => {
  render(<AtRiskStudentsCard students={[]} loading={false} onViewAll={() => {}} />);

  expect(screen.getByText("At-risk Students")).toBeInTheDocument();
  expect(screen.getByText("No major learner risk signals")).toBeInTheDocument();
  expect(screen.getByText(/tracking well/i)).toBeInTheDocument();
  expect(screen.queryByText(/critical/i)).not.toBeInTheDocument();
});

test("shows a loading state, not a false zero, while stats are still being fetched", () => {
  render(<AtRiskStudentsCard students={[]} loading onViewAll={() => {}} />);

  expect(screen.getByText(/Checking attendance and submissions/)).toBeInTheDocument();
  expect(screen.queryByText("No major learner risk signals")).not.toBeInTheDocument();
});

test("splits students into critical vs moderate severity chips", () => {
  render(
    <AtRiskStudentsCard
      students={[
        student({ studentId: 1, name: "Asha Rao", severity: 6, reasons: ["40% attendance"] }),
        student({ studentId: 2, name: "Ravi Kumar", severity: 3, reasons: ["2 submissions missing"] }),
      ]}
      loading={false}
      onViewAll={() => {}}
    />
  );

  expect(screen.getByText("1 critical")).toBeInTheDocument();
  expect(screen.getByText("1 moderate")).toBeInTheDocument();
  expect(screen.getByText("Asha Rao")).toBeInTheDocument();
  expect(screen.getByText("40% attendance")).toBeInTheDocument();
  expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
  expect(screen.getByText("2 submissions missing")).toBeInTheDocument();
});

test("shows a View all CTA only when there are more students than the visible rows", () => {
  const eight = Array.from({ length: 8 }, (_, i) => student({ studentId: i + 1, name: `Student ${i + 1}` }));
  render(<AtRiskStudentsCard students={eight} loading={false} onViewAll={() => {}} />);

  expect(screen.getByText("View all 8 students")).toBeInTheDocument();
  // Only the top 5 render as rows -- the rest are represented by the CTA, not silently dropped.
  expect(screen.getByText("Student 1")).toBeInTheDocument();
  expect(screen.getByText("Student 5")).toBeInTheDocument();
  expect(screen.queryByText("Student 6")).not.toBeInTheDocument();
});

// #6: clicking a row surfaces a risk %, plus whichever real signals that student actually has --
// never a fabricated stat for a signal they don't.
test("clicking a student reveals a risk snapshot with only the signals that actually apply", async () => {
  render(
    <AtRiskStudentsCard
      students={[
        student({
          studentId: 1,
          name: "Asha Rao",
          severity: 3,
          reasons: ["40% attendance"],
          attendancePercent: 40,
        }),
      ]}
      loading={false}
      onViewAll={() => {}}
      studentAverages={[{ studentId: 1, name: "Asha Rao", avgPercent: 72 }]}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: /Asha Rao/ }));

  // severity 3 of a max of 6 -> 50% risk
  expect(await screen.findByText("50% risk")).toBeInTheDocument();
  expect(screen.getByText("Attendance")).toBeInTheDocument();
  expect(screen.getByText("40%")).toBeInTheDocument();
  expect(screen.getByText("Average grade")).toBeInTheDocument();
  expect(screen.getByText("72%")).toBeInTheDocument();
  // No missing-submissions signal was passed in -- must not invent one.
  expect(screen.queryByText("Submissions missing")).not.toBeInTheDocument();
});

test("a student flagged only for missing submissions shows that stat, not a fabricated attendance number", async () => {
  render(
    <AtRiskStudentsCard
      students={[
        student({
          studentId: 2,
          name: "Ravi Kumar",
          severity: 2,
          reasons: ["2 submissions missing"],
          missingCount: 2,
        }),
      ]}
      loading={false}
      onViewAll={() => {}}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: /Ravi Kumar/ }));

  expect(await screen.findByText("Submissions missing")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.queryByText("Attendance")).not.toBeInTheDocument();
  expect(screen.queryByText("Average grade")).not.toBeInTheDocument();
});
