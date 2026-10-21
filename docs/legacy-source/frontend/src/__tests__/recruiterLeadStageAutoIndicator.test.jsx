/**
 * UI/UX audit, buy-signal extra "Making existing automation visible" (2026-10-01): Joined, Drive
 * planned and Recruited are worked out from facts server-side with zero TPO action - but the
 * stage chip used to look identical to a hand-set one (New/Contacted/Not now), so the automation
 * the product already does was invisible.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StageTag } from "@/components/tpo/recruiterLeadStages";

test("a hand-set stage (New) shows a plain tag with no automation cue", () => {
  render(<StageTag stage="NEW" />);
  expect(screen.getByText("New")).toBeInTheDocument();
  expect(screen.queryByLabelText("info-circle")).not.toBeInTheDocument();
});

test("Invited is a TPO-triggered action (sending the invite), not shown as automatic", () => {
  render(<StageTag stage="INVITED" />);
  expect(screen.getByText("Invited")).toBeInTheDocument();
  expect(screen.queryByLabelText("info-circle")).not.toBeInTheDocument();
});

test.each([
  ["JOINED", "Joined", /recruiter accepted your invite/i],
  ["DRIVE_PLANNED", "Drive planned", /this company now has a drive/i],
  ["RECRUITED", "Recruited", /student accepted an offer/i],
])("%s is worked out from facts and shows a why tooltip", async (stage, label, explainPattern) => {
  render(<StageTag stage={stage} />);
  expect(screen.getByText(label)).toBeInTheDocument();
  const icon = screen.getByLabelText("info-circle");
  expect(icon).toBeInTheDocument();
  fireEvent.mouseEnter(icon);
  expect(await screen.findByText(explainPattern)).toBeInTheDocument();
});
