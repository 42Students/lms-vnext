/**
 * UI/UX audit follow-up (MORE-01): the phone footer's More page was a bare Card+List of eight
 * plain text rows with no structure. Now grouped into Work/Insights/Account, each row with an
 * icon, a description, and a badge where a count is meaningful (pending requests, unread
 * messages).
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import TpoMore from "@/pages/tpo/more";
import { getCounts } from "@/api/Services/TpoHubService";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("react-redux", () => ({ useDispatch: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getCounts: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: mockPush });
  useDispatch.mockReturnValue(jest.fn());
  getCounts.mockResolvedValue({ data: { requests: 2, messages: 4, bell: 9 } });
});

test("groups destinations under Work / Insights / Account", async () => {
  render(<TpoMore />);
  expect(await screen.findByText("Work")).toBeInTheDocument();
  expect(screen.getByText("Insights")).toBeInTheDocument();
  expect(screen.getByText("Account")).toBeInTheDocument();
  expect(screen.getByText("Requests")).toBeInTheDocument();
  expect(screen.getByText("What students asked you to decide: withdrawals, off-campus offers, registration changes")).toBeInTheDocument();
});

test("shows a badge for pending requests and unread messages, and none where there's nothing", async () => {
  render(<TpoMore />);
  const requestsRow = (await screen.findByText("Requests")).closest('[role="link"]');
  expect(requestsRow).toHaveTextContent("2");
  const messagesRow = screen.getByText("Messages").closest('[role="link"]');
  expect(messagesRow).toHaveTextContent("4");
  const calendarRow = screen.getByText("Calendar").closest('[role="link"]');
  expect(calendarRow.textContent).not.toMatch(/\d/);
});

test("clicking a row navigates to its page", async () => {
  render(<TpoMore />);
  fireEvent.click(await screen.findByText("Settings"));
  expect(mockPush).toHaveBeenCalledWith("/tpo/settings");
});

// BE-0046: a failed count is said as such (with Retry), never shown as "nothing waiting".
test("a failed count says so and retries", async () => {
  getCounts.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: { requests: 3, messages: 0 } });
  render(<TpoMore />);
  expect(await screen.findByTestId("tpo.more.counts-failed")).toHaveTextContent("could not be counted");
  fireEvent.click(screen.getByText("Retry"));
  expect(await screen.findByText("3")).toBeInTheDocument();
  expect(screen.queryByTestId("tpo.more.counts-failed")).toBeNull();
});
