import React from "react";
import { render, screen } from "@testing-library/react";
import DrivePipeline from "@/components/tpo/drive/DrivePipeline";

test("a funnel whose later stage is bigger than the first shows no percentages (never 1100%)", () => {
  render(<DrivePipeline title="Company funnel" funnel={[{ stage: "Leads", count: 1 }, { stage: "Drives", count: 11 }, { stage: "Offers", count: 0 }]} />);
  expect(screen.getByText("11")).toBeInTheDocument();
  expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
});

test("a normal pipeline keeps its percentages of the first stage", () => {
  render(<DrivePipeline funnel={[{ stage: "APPLIED", count: 10 }, { stage: "SHORTLISTED", count: 4 }]} />);
  expect(screen.getByText("40%")).toBeInTheDocument();
});
