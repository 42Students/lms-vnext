/** RecruiterLead page audit: contact details can be fixed, and a follow-up is one tap for the usual next steps. */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import TpoRecruiterLeadPage from "@/pages/tpo/recruiters/[recruiterLeadId]";
import { addFollowUp, updateRecruiterLead } from "@/api/Services/TpoService";
import { getRecruiterLeadPage } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ __esModule: true, default: { events: { on: jest.fn(), off: jest.fn() }, asPath: "/" }, useRouter: () => ({ query: { recruiterLeadId: "4" }, push: jest.fn(), replace: jest.fn(), pathname: "/tpo/recruiters/[leadId]" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ addFollowUp: jest.fn(), logRecruiterLeadActivity: jest.fn(), markFollowUpDone: jest.fn(), markRecruiterLeadNotNow: jest.fn(), updateRecruiterLead: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getRecruiterLeadPage: jest.fn(), getCollegeSettings: jest.fn() }));
jest.mock("@/components/tpo/InviteModal", () => function InviteStub() { return null; });
jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
  getRecruiterLeadPage.mockResolvedValue({ data: { recruiterLead: { id: 4, name: "Ravi", companyName: "Varahi", stage: "NEW", phone: "9876543211", email: null, createdAt: "2026-09-01T10:00:00", drives: 0, studentsHired: 0 }, followUps: [], timeline: [], drives: [] } });
  updateRecruiterLead.mockResolvedValue({ data: {} });
  addFollowUp.mockResolvedValue({ data: {} });
});

test("Edit details sends the corrected contact", async () => {
  render(<TpoRecruiterLeadPage />);
  fireEvent.click(await screen.findByRole("button", { name: "More" }));
  fireEvent.click(await screen.findByText("Edit details"));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(dialog.querySelector('input[id="phone"]'), { target: { value: "9876543210" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(updateRecruiterLead).toHaveBeenCalledWith("4", expect.objectContaining({ name: "Ravi", phone: "9876543210", companyName: "Varahi" })));
});

test("Tomorrow 10 AM fills the follow-up in one tap", async () => {
  render(<TpoRecruiterLeadPage />);
  const card = (await screen.findByText("Follow-ups")).closest(".ant-card");
  fireEvent.click(within(card).getByRole("button", { name: "Add" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Tomorrow 10 AM" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Add follow-up" }));
  await waitFor(() => expect(addFollowUp).toHaveBeenCalled());
  // Tomorrow 10 AM (local), sent as UTC like every TPO time.
  const tenTomorrow = new Date(); tenTomorrow.setDate(tenTomorrow.getDate() + 1); tenTomorrow.setHours(10, 0, 0, 0);
  expect(addFollowUp.mock.calls[0][1].dueAt).toBe(tenTomorrow.toISOString().slice(0, 19));
});
