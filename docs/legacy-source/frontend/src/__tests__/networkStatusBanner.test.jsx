import React from "react";
import { act, render, screen } from "@testing-library/react";
import NetworkStatusBanner from "@/components/Common/NetworkStatusBanner";

const setOnline = (value) => {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, value });
};

describe("NetworkStatusBanner", () => {
  afterEach(() => {
    jest.useRealTimers();
    setOnline(true);
  });

  test("stays hidden while online and becomes persistent when the browser goes offline", () => {
    setOnline(true);
    render(<NetworkStatusBanner />);
    expect(screen.queryByTestId("network-status-banner")).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(screen.getByTestId("network-status-banner")).toHaveAttribute("role", "alert");
  });

  test("announces reconnection briefly, then clears the global banner", () => {
    jest.useFakeTimers();
    setOnline(false);
    render(<NetworkStatusBanner />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByText("Back online")).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(4000));
    expect(screen.queryByTestId("network-status-banner")).not.toBeInTheDocument();
  });
});
