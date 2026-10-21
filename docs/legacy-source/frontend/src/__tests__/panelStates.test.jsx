/**
 * Product-wide panel states: a failed load must never render as "empty" (they mean completely
 * different things), and a genuine empty state should offer a next step when one exists.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { PanelEmpty, PanelError } from "@/components/Common/PanelStates";

test("PanelError shows persistent recovery without masquerading as empty", () => {
  const onRetry = jest.fn();
  render(<PanelError title="Couldn't load students" onRetry={onRetry} />);
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("Couldn't load students");
  expect(alert).toHaveTextContent("Something went wrong while loading this content");
  fireEvent.click(screen.getByRole("button", { name: /Retry/i }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test("PanelEmpty shows the message and an optional CTA", () => {
  const onCta = jest.fn();
  render(<PanelEmpty icon={ExclamationCircleOutlined} title="No drives yet" subtitle="Post your first drive to get started." ctaLabel="New drive" onCta={onCta} />);
  expect(screen.getByText("No drives yet")).toBeInTheDocument();
  expect(screen.getByText("Post your first drive to get started.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "New drive" }));
  expect(onCta).toHaveBeenCalledTimes(1);
});

test("PanelEmpty renders without a CTA when none is given", () => {
  render(<PanelEmpty title="Nothing here" />);
  expect(screen.getByText("Nothing here")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});


test("PanelError exposes persistent assertive alert semantics for assistive technology", () => {
  render(<PanelError title="Couldn't load courses" />);
  const state = screen.getByRole("alert");
  expect(state).toHaveAttribute("aria-live", "assertive");
  expect(state).toHaveTextContent("Couldn't load courses");
});

test("PanelEmpty is a semantic status, not just visual decoration", () => {
  render(<PanelEmpty title="No assignments yet" />);
  expect(screen.getByRole("status")).toHaveTextContent("No assignments yet");
});
