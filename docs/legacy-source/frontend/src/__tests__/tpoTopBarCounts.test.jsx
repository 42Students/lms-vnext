/**
 * The top bar asks for two numbers every 30 seconds (never the lists), and the bell opens a panel beside the page
 * where unread items carry a dot and opening one reads it for this person.
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import TpoTopBar from "@/components/tpo/TpoTopBar";
import { bellRead, getBell, getCounts } from "@/api/Services/TpoHubService";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush, pathname: "/tpo/home", query: {} }) }));
jest.mock("@/api/Services/TpoHubService", () => ({ getBell: jest.fn(), bellRead: jest.fn(), bellReadAll: jest.fn(), globalSearch: jest.fn(), getCounts: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ addFollowUp: jest.fn() }));

beforeEach(() => { jest.clearAllMocks(); jest.useRealTimers(); });

test("uses the light counts call and never loads the lists", async () => {
  getCounts.mockResolvedValue({ data: { status: "success", data: { bell: 4, messages: 2 } } });
  render(<TpoTopBar />);
  expect(await screen.findByText("4")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(getBell).not.toHaveBeenCalled();
});

test("a background tab does not poll; it catches up when it is looked at again", async () => {
  jest.useFakeTimers();
  getCounts.mockResolvedValue({ data: { status: "success", data: { bell: 0, messages: 0 } } });
  const vis = jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  render(<TpoTopBar />);
  expect(getCounts).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(30000); });
  expect(getCounts).toHaveBeenCalledTimes(1);
  vis.mockReturnValue("visible");
  await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(getCounts).toHaveBeenCalledTimes(2);
  vis.mockRestore();
});

test("the bell opens a panel; an unread item has a dot, and opening it reads it and goes there", async () => {
  getCounts.mockResolvedValue({ data: { status: "success", data: { bell: 1, messages: 0 } } });
  getBell.mockResolvedValue({ data: { status: "success", data: [
    { id: 7, title: "Priya opened the applicant list", body: "Consultant", link: "/tpo/drives/22", readAt: null, createdAt: "2026-10-03T10:00:00" },
    { id: 6, title: "Older", link: "/tpo/home", readAt: "2026-10-02T10:00:00", createdAt: "2026-10-02T09:00:00" },
  ] } });
  bellRead.mockResolvedValue({ data: { status: "success", data: { updated: 1 } } });
  render(<TpoTopBar />);
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  const item = await screen.findByText("Priya opened the applicant list");
  expect(screen.getAllByText("New notification.")).toHaveLength(1);
  fireEvent.click(item);
  await waitFor(() => expect(bellRead).toHaveBeenCalledWith(7));
  expect(mockPush).toHaveBeenCalledWith("/tpo/drives/22");
  expect(mockPush).not.toHaveBeenCalledWith("/tpo/notifications");
});
