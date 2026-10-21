import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScoreDistributionBars from "../ScoreDistributionBars";

const DISTRIBUTION = [
  { label: "90-100%", count: 2 },
  { label: "80-89%", count: 3 },
  { label: "70-79%", count: 1 },
  { label: "60-69%", count: 0 },
  { label: "Below 60%", count: 2 },
];

test("renders every bucket with its count, in the given order", () => {
  render(<ScoreDistributionBars distribution={DISTRIBUTION} />);

  const rows = document.querySelectorAll(".ln-score-distribution__row");
  expect(rows).toHaveLength(5);
  DISTRIBUTION.forEach((bucket, i) => {
    expect(within(rows[i]).getByText(bucket.label)).toBeInTheDocument();
    expect(within(rows[i]).getByText(String(bucket.count))).toBeInTheDocument();
  });
});

test("a zero-count bucket renders a zero-width bar, not a false sliver", () => {
  render(<ScoreDistributionBars distribution={DISTRIBUTION} />);

  const rows = document.querySelectorAll(".ln-score-distribution__row");
  const zeroRow = Array.from(rows).find((row) => within(row).queryByText("60-69%"));
  const fill = zeroRow.querySelector(".ln-score-distribution__fill");
  expect(fill.style.width).toBe("0%");
});

test("a non-zero bucket never renders thinner than the visibility floor", () => {
  // 1 out of 100 would round to 1%, effectively invisible -- the component enforces a 6% floor
  // for any non-zero count so a single student is never mistaken for zero.
  const distribution = [{ label: "90-100%", count: 1 }, { label: "80-89%", count: 99 }];
  render(<ScoreDistributionBars distribution={distribution} />);

  const rows = document.querySelectorAll(".ln-score-distribution__row");
  const tinyRow = Array.from(rows).find((row) => within(row).queryByText("90-100%"));
  const fill = tinyRow.querySelector(".ln-score-distribution__fill");
  expect(parseInt(fill.style.width, 10)).toBeGreaterThanOrEqual(6);
});


test("renders an explicit no-data state instead of an empty chart when no scores are graded", () => {
  render(<ScoreDistributionBars distribution={[
    { label: "90-100%", count: 0 },
    { label: "80-89%", count: 0 },
  ]} />);
  expect(screen.getByRole("status")).toHaveTextContent("No graded scores to chart yet.");
  expect(document.querySelector(".ln-score-distribution__row")).not.toBeInTheDocument();
});

test("ignores malformed buckets rather than crashing the report", () => {
  expect(() => render(
    <ScoreDistributionBars distribution={[null, "bad", { label: "90-100%", count: "2" }]} />
  )).not.toThrow();
  expect(screen.getByText("90-100%")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
});
