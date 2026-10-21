/** Messages audit: the inbox can start a conversation with any recruiter who has access, not only answer one. */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import MessagesPanel from "@/components/tpo/MessagesPanel";
import { getThreads, sendMessage } from "@/api/Services/TpoHubService";
import { listRecruiterAccess } from "@/api/Services/TpoService";

jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1, firstName: "Asha" } }) }));
jest.mock("@/api/Services/TpoHubService", () => ({ getThreads: jest.fn(), getThread: jest.fn(() => Promise.resolve({ data: [] })), sendMessage: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ listRecruiterAccess: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  getThreads.mockResolvedValue({ data: [] });
  listRecruiterAccess.mockResolvedValue({ data: [
    { recruiterId: 7, name: "Ravi", company: "Zoho", status: "ACTIVE" },
    { recruiterId: 8, name: "Gone", company: "Old", status: "REVOKED", revokedAt: "2026-01-01" },
  ] });
  sendMessage.mockResolvedValue({ data: { threadId: 99 } });
});

test("New message lists only recruiters with access and sends a General message", async () => {
  render(<MessagesPanel />);
  expect(await screen.findByText("Start a conversation with New message. Messages about a drive are best sent from that drive.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /New message/ }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.mouseDown(within(dialog).getByRole("combobox"));
  fireEvent.click(await screen.findByText("Ravi · Zoho"));
  expect(screen.queryByText("Gone · Old")).not.toBeInTheDocument();
  fireEvent.change(within(dialog).getByPlaceholderText("Write a message"), { target: { value: "Hello from NSRIT" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));
  await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ recruiterId: 7, jobId: null, body: "Hello from NSRIT" }));
});
