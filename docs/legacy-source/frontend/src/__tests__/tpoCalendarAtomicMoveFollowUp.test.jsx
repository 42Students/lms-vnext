/**
 * UI/UX audit (Batch 6): the Move-follow-up modal used to mark the old follow-up Done, then
 * create a brand new one - two separate requests, so a failure on the second request left the
 * follow-up completed with no replacement, effectively gone. Drag-and-drop already used the
 * proper atomic moveFollowUp endpoint; the modal now uses it too instead of the two-step dance.
 */
import React from "react";
import { fireEvent, render, screen, configure } from "@testing-library/react";
import TpoCalendar from "@/pages/tpo/calendar";
import { addFollowUp, markFollowUpDone, moveFollowUp } from "@/api/Services/TpoService";
import { getCalendar } from "@/api/Services/TpoHubService";
import { dj } from "@/components/tpo/dj";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), query: {} }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getCalendar: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ markFollowUpDone: jest.fn(), moveFollowUp: jest.fn(), addFollowUp: jest.fn() }));

// "Today" so the Week view (this test's default) always includes it, regardless of which real
// calendar day the suite happens to run on.
const followUp = { type: "FOLLOW_UP", id: 501, recruiterLeadId: 9, title: "Call Priya", startsAt: dj().hour(10).minute(0).format("YYYY-MM-DDTHH:mm:ss"), note: "Follow up on proposal" };

// These render full pages with antd Selects/Modals; under a loaded CI/dev machine the default 5s is flaky.
jest.setTimeout(30000);
// antd's modal open transition can take longer than RTL's default 1s waitFor on a loaded machine.
configure({ asyncUtilTimeout: 8000 });

beforeEach(() => {
  jest.clearAllMocks();
  getCalendar.mockResolvedValue({ data: { status: "success", data: [followUp] } });
  moveFollowUp.mockResolvedValue({ data: { status: "success", data: {} } });
});

const hoverFollowUpEvent = async () => {
  const matches = await screen.findAllByText("Call Priya");
  const eventLabel = matches.find((node) => node.closest(".tpo-calendar__event"));
  if (!eventLabel) throw new Error("Calendar follow-up event was not rendered");
  fireEvent.mouseEnter(eventLabel.closest(".tpo-calendar__event"));
};

test("moving a follow-up via the modal calls the atomic moveFollowUp endpoint, not the old two-step dance", async () => {
  render(<TpoCalendar />);
  await hoverFollowUpEvent();
  fireEvent.click(await screen.findByRole("button", { name: "Move" }));

  fireEvent.click(await screen.findByRole("button", { name: "OK" }));

  expect(moveFollowUp).toHaveBeenCalledWith(501, expect.any(String));
  expect(markFollowUpDone).not.toHaveBeenCalled();
  expect(addFollowUp).not.toHaveBeenCalled();
});

test("a failed move keeps the follow-up intact and reports the error", async () => {
  moveFollowUp.mockRejectedValue({ response: { data: { message: "Network blip" } } });
  render(<TpoCalendar />);
  await hoverFollowUpEvent();
  fireEvent.click(await screen.findByRole("button", { name: "Move" }));
  fireEvent.click(await screen.findByRole("button", { name: "OK" }));

  expect(await screen.findByText("Network blip")).toBeInTheDocument();
  expect(markFollowUpDone).not.toHaveBeenCalled();
});
