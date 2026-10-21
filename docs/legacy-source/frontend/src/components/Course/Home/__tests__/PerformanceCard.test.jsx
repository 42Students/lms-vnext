import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PerformanceCard from "../PerformanceCard";

const DISTRIBUTION = [
  { label: "90-100%", min: 90, max: 100, count: 2 },
  { label: "80-89%", min: 80, max: 89, count: 3 },
  { label: "70-79%", min: 70, max: 79, count: 1 },
  { label: "60-69%", min: 60, max: 69, count: 0 },
  { label: "Below 60%", min: 0, max: 59, count: 2 },
];

test("shows an empty state, not a 0%, before anything has been graded", () => {
  render(<PerformanceCard stats={{ distribution: [], avgPercent: null }} loading={false} onViewAll={() => {}} />);

  expect(screen.getByText("Performance")).toBeInTheDocument();
  expect(screen.getByText("No graded submissions yet")).toBeInTheDocument();
  expect(screen.queryByText("0%")).not.toBeInTheDocument();
});

test("shows a loading state while stats are still being fetched", () => {
  render(<PerformanceCard stats={undefined} loading onViewAll={() => {}} />);

  expect(screen.getByText(/Averaging graded work/)).toBeInTheDocument();
});

test("renders the full grade distribution with counts, not just the average", () => {
  render(
    <PerformanceCard
      stats={{ distribution: DISTRIBUTION, avgPercent: 74, contentAverages: [] }}
      loading={false}
      onViewAll={() => {}}
    />
  );

  expect(screen.getByText("74%")).toBeInTheDocument();
  for (const bucket of DISTRIBUTION) {
    const label = screen.getByText(bucket.label);
    const row = label.closest(".ln-score-distribution__row");
    expect(within(row).getByText(String(bucket.count))).toBeInTheDocument();
  }
});

test("surfaces the weakest graded item once it has enough graded submissions to mean something", () => {
  render(
    <PerformanceCard
      stats={{
        distribution: DISTRIBUTION,
        avgPercent: 74,
        contentAverages: [
          { id: 1, title: "Quiz 1: Basics", avgPercent: 88, gradedCount: 10 },
          { id: 2, title: "Quiz 3: Loops", avgPercent: 52, gradedCount: 6 },
          { id: 3, title: "Quiz 4: Just released", avgPercent: 40, gradedCount: 1 },
        ],
      }}
      loading={false}
      onViewAll={() => {}}
    />
  );

  // Quiz 4 has the lowest average but only 1 grade -- not a real signal yet, Quiz 3 is.
  expect(screen.getByText("Quiz 3: Loops")).toBeInTheDocument();
  expect(screen.getByText(/averaging 52%/)).toBeInTheDocument();
  expect(screen.queryByText("Quiz 4: Just released")).not.toBeInTheDocument();
});

test("a low average is visually flagged", () => {
  render(
    <PerformanceCard
      stats={{ distribution: DISTRIBUTION, avgPercent: 42, contentAverages: [] }}
      loading={false}
      onViewAll={() => {}}
    />
  );

  expect(screen.getByText("42%")).toHaveClass("learn-performance-card__avg--low");
});

// #7: the weakest-item insight already existed; the strongest one is new, and must not repeat
// itself when there's only one qualifying item to name.
test("surfaces the strongest graded item alongside the weakest, once there are two distinct ones", () => {
  render(
    <PerformanceCard
      stats={{
        distribution: DISTRIBUTION,
        avgPercent: 74,
        contentAverages: [
          { id: 1, title: "Quiz 1: Basics", avgPercent: 88, gradedCount: 10 },
          { id: 2, title: "Quiz 3: Loops", avgPercent: 52, gradedCount: 6 },
        ],
      }}
      loading={false}
      onViewAll={() => {}}
    />
  );

  expect(screen.getByText("Quiz 3: Loops")).toBeInTheDocument();
  expect(screen.getByText(/averaging 52%/)).toBeInTheDocument();
  expect(screen.getByText("Quiz 1: Basics")).toBeInTheDocument();
  expect(screen.getByText(/averaging 88%/)).toBeInTheDocument();
});

test("does not say the same single item is both the weakest and strongest spot", () => {
  render(
    <PerformanceCard
      stats={{
        distribution: DISTRIBUTION,
        avgPercent: 74,
        contentAverages: [{ id: 1, title: "Only Quiz", avgPercent: 70, gradedCount: 5 }],
      }}
      loading={false}
      onViewAll={() => {}}
    />
  );

  expect(screen.getAllByText("Only Quiz")).toHaveLength(1);
});

// #6/#7: clicking a non-empty bucket reveals exactly which students landed in it.
test("clicking a grade bucket reveals which students are in it", async () => {
  render(
    <PerformanceCard
      stats={{
        distribution: DISTRIBUTION,
        avgPercent: 74,
        contentAverages: [],
        studentAverages: [
          { studentId: 1, name: "Asha Rao", avgPercent: 95 },
          { studentId: 2, name: "Ravi Kumar", avgPercent: 91 },
        ],
      }}
      loading={false}
      onViewAll={() => {}}
    />
  );

  fireEvent.click(screen.getByText("90-100%"));

  expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
  expect(screen.getByText("95%")).toBeInTheDocument();
  expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
});

test("an empty bucket is not clickable and reveals nothing", () => {
  render(
    <PerformanceCard
      stats={{ distribution: DISTRIBUTION, avgPercent: 74, contentAverages: [], studentAverages: [] }}
      loading={false}
      onViewAll={() => {}}
    />
  );

  // "60-69%" has count 0 in DISTRIBUTION -- clicking its label must not open a popover.
  fireEvent.click(screen.getByText("60-69%"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
