/**
 * Placements UX pass — the drive pipeline funnel card (OverviewTab). Proves the chip row
 * renders the right stage labels/counts/percentages from TpoWorkspaceService.funnel's shape,
 * and that clicking a chip calls onStageClick with the stage key. (The funnel chart was replaced by
 * one bar row per stage: no chart library, no canvas, same data.)
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DrivePipeline from "@/components/tpo/drive/DrivePipeline";

const funnel = [
  { stage: "APPLIED", count: 100 },
  { stage: "SHORTLISTED", count: 40 },
  { stage: "ASSESSMENT", count: 0 },
  { stage: "INTERVIEW", count: 12 },
  { stage: "OFFERED", count: 5 },
  { stage: "HIRED", count: 3 },
];

test("renders a chip per stage with count and conversion %, Applied has no %", () => {
  render(<DrivePipeline funnel={funnel} onStageClick={jest.fn()} />);
  expect(screen.getByText("Applied")).toBeInTheDocument();
  expect(screen.getByText("100")).toBeInTheDocument();
  expect(screen.getByText("Interview")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getByText("12%")).toBeInTheDocument(); // 12/100
  // Applied's own chip has a count but no conversion % (it IS the 100% baseline).
  const appliedChip = screen.getByText("Applied").closest("button");
  expect(appliedChip.textContent).not.toMatch(/%/);
});

test("defaults to 'Drive pipeline' but can be titled 'Season pipeline' for the Home dashboard", () => {
  const { rerender } = render(<DrivePipeline funnel={funnel} onStageClick={jest.fn()} />);
  expect(screen.getByText("Drive pipeline")).toBeInTheDocument();
  rerender(<DrivePipeline funnel={funnel} onStageClick={jest.fn()} title="Season pipeline" />);
  expect(screen.getByText("Season pipeline")).toBeInTheDocument();
});

test("clicking a stage chip calls onStageClick with that stage's key", () => {
  const onStageClick = jest.fn();
  render(<DrivePipeline funnel={funnel} onStageClick={onStageClick} />);
  fireEvent.click(screen.getByText("Offered").closest("button"));
  expect(onStageClick).toHaveBeenCalledWith("OFFERED");
});

test("renders nothing when there's no funnel data yet", () => {
  const { container } = render(<DrivePipeline funnel={[]} onStageClick={jest.fn()} />);
  expect(container).toBeEmptyDOMElement();
});

test("renders nothing when nobody has applied (all-zero funnel)", () => {
  const zeroed = funnel.map((f) => ({ ...f, count: 0 }));
  const { container } = render(<DrivePipeline funnel={zeroed} onStageClick={jest.fn()} />);
  expect(container).toBeEmptyDOMElement();
});
