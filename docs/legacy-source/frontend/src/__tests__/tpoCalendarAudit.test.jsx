/** Calendar audit: one row of type chips is legend and filter; Agenda pages by 30 days, not a week. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TpoCalendar from "@/pages/tpo/calendar";
import { getCalendar } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), query: {}, pathname: "/tpo/calendar" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getCalendar: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ markFollowUpDone: jest.fn(), moveFollowUp: jest.fn() }));
jest.mock("@/components/tpo/WeekTimeGrid", () => function WeekStub() { return <div>week</div>; });
jest.mock("@/components/tpo/FollowUpModal", () => function FollowUpStub() { return null; });

beforeEach(() => {
  jest.clearAllMocks();
  getCalendar.mockResolvedValue({ data: [{ type: "DEADLINE", jobId: 1, title: "Zoho closes", startsAt: "2099-01-05T17:00:00" }] });
});

test("type chips carry counts; with every type shown none is pressed, a tap shows only that type, a second tap shows everything", async () => {
  render(<TpoCalendar />);
  const deadline = await screen.findByRole("button", { name: /Deadline 1/ });
  expect(deadline).toHaveAttribute("aria-pressed", "false"); // all types shown: nothing singled out
  fireEvent.click(deadline);
  expect(screen.getByRole("button", { name: /Deadline 1/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: /Round 0/ })).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(screen.getByRole("button", { name: /Deadline 1/ }));
  expect(screen.getByRole("button", { name: /Deadline 1/ })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("button", { name: /Round 0/ })).toHaveAttribute("aria-pressed", "false");
});

test("Next in Agenda moves 30 days", async () => {
  render(<TpoCalendar />);
  await screen.findByRole("button", { name: /Deadline 1/ });
  // The page also loads the next 7 days and the last 90 for its Today card: compare the latest range only.
  let calls = getCalendar.mock.calls.length;
  fireEvent.click(screen.getByText("Agenda"));
  await waitFor(() => expect(getCalendar.mock.calls.length).toBeGreaterThan(calls));
  const [from] = getCalendar.mock.calls[getCalendar.mock.calls.length - 1];
  calls = getCalendar.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(getCalendar.mock.calls.length).toBeGreaterThan(calls));
  const [next] = getCalendar.mock.calls[getCalendar.mock.calls.length - 1];
  expect((new Date(next) - new Date(from)) / 86400000).toBe(30);
});
