import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  PanelEmpty,
  PanelError,
  PanelNotFound,
  PanelOffline,
  PanelPartial,
  PanelPermissionDenied,
  PanelSuccess,
  StatusBadge,
  getStatusPresentation,
} from "../PanelStates";

describe("shared panel state system", () => {
  test("error state keeps recovery next to the failure", () => {
    const retry = jest.fn();
    render(<PanelError title="Assignments failed" onRetry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Assignments failed");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test("permission and removed states are distinct from empty data", () => {
    const { rerender } = render(<PanelPermissionDenied />);
    expect(screen.getByRole("status")).toHaveTextContent("don't have access");

    rerender(<PanelNotFound />);
    expect(screen.getByRole("status")).toHaveTextContent("no longer available");
  });

  test("offline and partial states explain recovery without clearing useful context", () => {
    const retry = jest.fn();
    const { rerender } = render(<PanelOffline onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("offline");

    rerender(<PanelPartial onRetry={retry}>Loaded summary remains visible</PanelPartial>);
    expect(screen.getByRole("status")).toHaveTextContent("Loaded summary remains visible");
    expect(screen.getByRole("button", { name: "Retry missing data" })).toBeInTheDocument();
  });

  test("success provides an explicit resting endpoint when a flow needs one", () => {
    render(<PanelSuccess title="Import complete" description="24 learners were added." />);
    expect(screen.getByRole("status")).toHaveTextContent("Import complete");
    expect(screen.getByRole("status")).toHaveTextContent("24 learners were added");
  });

  test("canonical lifecycle vocabulary normalizes common aliases", () => {
    expect(getStatusPresentation("IN_PROGRESS")).toMatchObject({
      key: "active",
      label: "Active",
      tone: "success",
    });
    expect(getStatusPresentation("expired")).toMatchObject({
      label: "Expired",
      tone: "error",
    });
    expect(getStatusPresentation("COMPLETED")).toMatchObject({
      key: "completed",
      label: "Completed",
      tone: "success",
    });
    expect(getStatusPresentation("done")).toMatchObject({
      key: "completed",
      label: "Completed",
    });
    expect(getStatusPresentation("evaluated")).toMatchObject({
      key: "evaluated",
      label: "Evaluated",
    });
  });

  test("canonical tone can keep domain-specific wording", () => {
    expect(getStatusPresentation("active", "Live")).toMatchObject({
      key: "active",
      label: "Live",
      tone: "success",
    });
  });

  test("domain status badges can override tone without losing text meaning", () => {
    render(<StatusBadge status="interview" label="Interview" tone="info" icon={<span data-testid="status-icon">I</span>} />);
    const badge = screen.getByText("Interview").closest(".lms-status-badge");

    expect(badge).toHaveClass("lms-status-badge--info");
    expect(screen.getByTestId("status-icon")).toBeInTheDocument();
    expect(badge.querySelector(".lms-status-badge__dot")).toBeNull();
  });

  test("status badges always expose text so color is never the only signal", () => {
    render(<StatusBadge status="FAILED" />);
    const badge = screen.getByText("Failed").closest(".lms-status-badge");
    expect(badge).toHaveAttribute("data-status", "failed");
    expect(badge).toHaveClass("lms-status-badge--error");
  });
});


test("error panels use assertive atomic announcement semantics", () => {
  render(<PanelError title="Couldn't load students" />);
  const alert = screen.getByRole("alert");
  expect(alert).toHaveAttribute("aria-live", "assertive");
  expect(alert).toHaveAttribute("aria-atomic", "true");
});

test("non-error panel states remain polite atomic announcements", () => {
  render(<PanelEmpty title="Nothing here" />);
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status).toHaveAttribute("aria-atomic", "true");
});
