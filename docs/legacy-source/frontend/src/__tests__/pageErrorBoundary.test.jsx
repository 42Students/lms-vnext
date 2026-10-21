import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import PageErrorBoundary from "@/components/ErrorBoundary/PageErrorBoundary";
import { reportReactBoundaryError } from "@/utils/clientErrorReporting";

jest.mock("@/utils/clientErrorReporting", () => ({
  reportReactBoundaryError: jest.fn(),
}));

function Crash({ shouldThrow = true }) {
  if (shouldThrow) throw new Error("render exploded");
  return <div>Healthy page</div>;
}

describe("PageErrorBoundary", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("contains a routed page crash and reports it without exposing technical details", () => {
    render(
      <PageErrorBoundary resetKey="/courses">
        <Crash />
      </PageErrorBoundary>
    );

    expect(screen.getByText("This page could not be displayed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("render exploded")).not.toBeInTheDocument();
    expect(reportReactBoundaryError).toHaveBeenCalledTimes(1);
  });

  test("resets automatically when navigation changes", async () => {
    const { rerender } = render(
      <PageErrorBoundary resetKey="/courses">
        <Crash />
      </PageErrorBoundary>
    );

    rerender(
      <PageErrorBoundary resetKey="/assignments">
        <Crash shouldThrow={false} />
      </PageErrorBoundary>
    );

    await waitFor(() => expect(screen.getByText("Healthy page")).toBeInTheDocument());
  });
});
