import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShareModal from "@/components/tpo/drive/ShareModal";
import { getShares, getShareEvents, getMailStatus } from "@/api/Services/TpoHubService";

jest.mock("@/api/Services/TpoHubService", () => ({
  createShare: jest.fn(),
  getMailStatus: jest.fn(),
  getShareEvents: jest.fn(),
  getShares: jest.fn(),
  revokeShare: jest.fn(),
}));
jest.mock("@/components/tpo/ui/shareMemory", () => ({ readShareMemory: () => null, writeShareMemory: jest.fn() }));

const live = { id: 4, recipientEmail: "hr@acme.test", createdAt: "2026-10-01T10:00:00", expiresAt: "2099-01-01T00:00:00", opens: 2, downloads: 1 };

beforeEach(() => {
  jest.clearAllMocks();
  getShares.mockReset();
  getShareEvents.mockReset();
  getMailStatus.mockResolvedValue({ data: { configured: false } });
});

// BE-0047: failures are said, not shown as "no links" or "Nothing yet".
test("a failed list load on open shows the warning, not an empty list", async () => {
  getShares.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce({ data: [live] });
  render(<ShareModal open job={{ id: 9, companyName: "Acme" }} applicantCount={3} onClose={() => {}} />);
  expect(await screen.findByTestId("tpo.share.list-error")).toHaveTextContent("could not be loaded");
  fireEvent.click(screen.getByText("Retry"));
  expect(await screen.findByText("hr@acme.test")).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByTestId("tpo.share.list-error")).toBeNull());
});

test("a failed activity load does not open an empty 'Nothing yet' history", async () => {
  getShares.mockResolvedValue({ data: [live] });
  getShareEvents.mockRejectedValueOnce(new Error("500"));
  render(<ShareModal open job={{ id: 9, companyName: "Acme" }} applicantCount={3} onClose={() => {}} />);
  fireEvent.click(await screen.findByText("Activity"));
  await waitFor(() => expect(getShareEvents).toHaveBeenCalledWith(4));
  expect(screen.queryByText("Nothing yet")).toBeNull();
});
