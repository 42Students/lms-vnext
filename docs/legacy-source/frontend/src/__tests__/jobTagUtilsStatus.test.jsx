import React from "react";
import { render, screen } from "@testing-library/react";
import {
  getApplicationStatusLabel,
  getApplicationStatusTag,
} from "@/utils/jobTagUtils";

describe("placement application status presentation", () => {
  test("uses the shared semantic badge contract for successful outcomes", () => {
    const { container } = render(getApplicationStatusTag("HIRED"));
    const badge = screen.getByText("Hired").closest(".lms-status-badge");

    expect(badge).toHaveClass("lms-status-badge--success");
    expect(badge).toHaveAttribute("data-status", "hired");
    expect(container.querySelector(".anticon-check-circle")).toBeTruthy();
  });

  test("uses warning/error tones without relying on color-only meaning", () => {
    const { rerender } = render(getApplicationStatusTag("WAITLISTED"));
    expect(screen.getByText("Waitlisted").closest(".lms-status-badge"))
      .toHaveClass("lms-status-badge--warning");

    rerender(getApplicationStatusTag("REJECTED"));
    expect(screen.getByText("Rejected").closest(".lms-status-badge"))
      .toHaveClass("lms-status-badge--error");
  });

  test("keeps readable labels for multi-word backend statuses", () => {
    expect(getApplicationStatusLabel("RESCHEDULE_REQUESTED"))
      .toBe("Reschedule requested");
  });
});
