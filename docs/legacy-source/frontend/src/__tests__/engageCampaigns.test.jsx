/** Step 17: emails from Engage go to the chosen recruiters with an email who have not unsubscribed. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Campaigns, { CampaignComposer, EMAIL_NOT_SET_UP } from "@/components/tpo/engage/Campaigns";
import CampaignUnsubscribePage from "@/pages/campaign-unsubscribe/[token]";
import { listCampaigns, sendCampaign } from "@/api/Services/TpoHubService";
import { unsubscribeCampaign } from "@/api/Services/TpoService";

jest.setTimeout(30000);
jest.mock("next/router", () => ({ useRouter: () => ({ query: { token: "t1" } }) }));
jest.mock("@/api/Services/TpoHubService", () => ({ listCampaigns: jest.fn(), sendCampaign: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ unsubscribeCampaign: jest.fn() }));
const ok = (data) => Promise.resolve({ data: { status: "success", data } });

beforeEach(() => jest.clearAllMocks());

test("the email goes only to recruiters who can be reached", async () => {
  listCampaigns.mockReturnValue(ok({ campaigns: [], emailAvailable: true }));
  sendCampaign.mockReturnValue(ok({ sent: 1, skipped: 0, failed: 0, emailAvailable: true }));
  const onClose = jest.fn();
  render(<CampaignComposer open onClose={onClose} recruiterLeads={[{ id: 1, email: "a@omega.com" }, { id: 2, email: null }, { id: 3, email: "c@zeta.com", unsubscribedAt: "2026-10-01" }]} />);
  expect(await screen.findByText(/2 left out/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Campus hiring 2027" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "Hello {name}" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(sendCampaign).toHaveBeenCalledWith({ subject: "Campus hiring 2027", body: "Hello {name}", recruiterLeadIds: [1] }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

test("the list says when campaign email is not set up", async () => {
  listCampaigns.mockReturnValue(ok({ campaigns: [{ id: 3, subject: "Campus hiring 2027", sent: 10, skipped: 2, failed: 0, createdAt: "2026-10-12T10:00:00", sentBy: "Asha" }], emailAvailable: false }));
  render(<Campaigns />);
  expect(await screen.findByText("Campus hiring 2027")).toBeInTheDocument();
  expect(screen.getByText(EMAIL_NOT_SET_UP)).toBeInTheDocument();
  expect(screen.getByText("10 sent")).toBeInTheDocument();
});

test("unsubscribing takes a button press, never just opening the link", async () => {
  unsubscribeCampaign.mockResolvedValue({ data: { status: "UNSUBSCRIBED" } });
  render(<CampaignUnsubscribePage />);
  expect(unsubscribeCampaign).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Unsubscribe" }));
  expect(await screen.findByText("You're unsubscribed")).toBeInTheDocument();
  expect(unsubscribeCampaign).toHaveBeenCalledWith("t1");
});
