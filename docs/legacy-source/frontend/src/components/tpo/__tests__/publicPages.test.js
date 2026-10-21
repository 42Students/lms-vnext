import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("next/router", () => ({ useRouter: () => ({ query: { token: "tok123" }, isReady: true, push: jest.fn(), replace: jest.fn() }) }));
jest.mock("@/api/Services/TpoService", () => ({
  previewRecruiterInvite: jest.fn(() => Promise.resolve({ data: { collegeName: "NSRIT", companyName: "Zeta", contactName: "Ravi", email: "ravi@zeta.com" } })),
  acceptRecruiterInvite: jest.fn(),
  sendRecruiterInviteCode: jest.fn(() => Promise.resolve({ data: { status: "CODE_SENT", email: "ravi@zeta.com" } })),
  recruiterInviteNotHiring: jest.fn(() => Promise.resolve({ data: {} })),
  recruiterInviteUnsubscribe: jest.fn(() => Promise.resolve({ data: {} })),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  getShareInfo: jest.fn(() => Promise.resolve({ data: { company: "Acme", role: "SDE", expiresAt: "2026-10-05T10:00:00", emailCodeAvailable: true } })),
  openShare: jest.fn(),
  sendShareCode: jest.fn(() => Promise.resolve({ data: { status: "SENT" } })),
  downloadShareResumes: jest.fn(),
  logShareDownload: jest.fn(),
}));

import RecruiterInvitePage from "@/pages/recruiter-invite/[token]";
import CompanySharePage from "@/pages/company-share/[token]";
import { acceptRecruiterInvite, previewRecruiterInvite, recruiterInviteNotHiring } from "@/api/Services/TpoService";
import { getShareInfo, openShare, sendShareCode } from "@/api/Services/TpoHubService";

describe("public invite and share pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    previewRecruiterInvite.mockResolvedValue({ data: { collegeName: "NSRIT", companyName: "Zeta", contactName: "Ravi", email: "ravi@zeta.com" } });
    recruiterInviteNotHiring.mockResolvedValue({ data: {} });
    getShareInfo.mockResolvedValue({ data: { company: "Acme", role: "SDE", expiresAt: "2026-10-05T10:00:00", emailCodeAvailable: true } });
  });
  it("the invite page shows who invited and lets the recruiter say they are not hiring", async () => {
    render(<RecruiterInvitePage />);
    await screen.findByText(/would like you to hire/i);
    fireEvent.click(screen.getByText(/Not hiring from this college/i));
    await waitFor(() => expect(recruiterInviteNotHiring).toHaveBeenCalledWith("tok123"));
    await screen.findByText(/we have told the placement cell/i);
  });

  it("a transient invite-preview failure is retryable and is not called an invalid link", async () => {
    previewRecruiterInvite.mockRejectedValueOnce({ response: { status: 503, data: { message: "Service unavailable" } } });
    render(<RecruiterInvitePage />);

    expect(await screen.findByText("We couldn't load this invitation")).toBeInTheDocument();
    expect(screen.queryByText("This link is no longer valid")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText(/would like you to hire/i)).toBeInTheDocument();
  });

  it("a failed not-hiring response keeps the valid invite actionable instead of declaring it invalid", async () => {
    recruiterInviteNotHiring.mockRejectedValueOnce({ response: { status: 503, data: { message: "Could not save response" } } });
    render(<RecruiterInvitePage />);
    await screen.findByText(/would like you to hire/i);

    fireEvent.click(screen.getByText(/Not hiring from this college/i));

    expect(await screen.findByText("Could not save response")).toBeInTheDocument();
    expect(screen.getByText(/would like you to hire/i)).toBeInTheDocument();
    expect(screen.queryByText("This link is no longer valid")).not.toBeInTheDocument();
  });

  it("a successful HTTP accept without a usable payload does not claim the recruiter joined", async () => {
    acceptRecruiterInvite.mockResolvedValueOnce({ data: null });
    render(<RecruiterInvitePage />);
    await screen.findByText(/would like you to hire/i);

    // Recruiter phase 1: a code goes to the work email first, then Join.
    fireEvent.click(screen.getByRole("button", { name: "Send me a code" }));
    fireEvent.change(await screen.findByLabelText(/Code sent to ravi@zeta.com/), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /Join NSRIT placements/ }));

    expect(await screen.findByText(/could not confirm that the invitation was accepted/i)).toBeInTheDocument();
    expect(screen.queryByText(/You now have access to/i)).not.toBeInTheDocument();
  });

  it("the share page offers to email a code when that is available", async () => {
    render(<CompanySharePage />);
    await screen.findByText(/Applicants for SDE/i);
    fireEvent.click(screen.getByText(/Email me a code instead/i));
    await waitFor(() => expect(sendShareCode).toHaveBeenCalledWith("tok123"));
  });

  it("the share page shows stages in words, never the stored code", async () => {
    openShare.mockResolvedValueOnce({ data: { role: "SDE", columns: ["name", "stage"], applicants: [
      { applicantId: "A1", name: "Asha", stage: "ASSESSMENT" }, { applicantId: "A2", name: "Ravi", stage: "REJECTED" }] } });
    render(<CompanySharePage />);
    await screen.findByText(/Applicants for SDE/i);
    fireEvent.change(screen.getByPlaceholderText("6-digit code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByText("Open"));
    await screen.findByText("Test");
    expect(screen.getByText("Not selected")).toBeTruthy();
    expect(screen.queryByText("ASSESSMENT")).toBeNull();
  });

  it("a transient applicant-share preview failure is retryable instead of being called revoked", async () => {
    getShareInfo.mockRejectedValueOnce({ response: { status: 503, data: { message: "Share service unavailable" } } });
    render(<CompanySharePage />);

    expect(await screen.findByText("We couldn't load this share")).toBeInTheDocument();
    expect(screen.queryByText("This link is not valid any more.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText(/Applicants for SDE/i)).toBeInTheDocument();
  });

  it("a malformed successful applicant-share open does not render fabricated applicant data", async () => {
    openShare.mockResolvedValueOnce({ data: { role: "SDE" } });
    render(<CompanySharePage />);
    await screen.findByText(/Applicants for SDE/i);
    fireEvent.change(screen.getByPlaceholderText("6-digit code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(await screen.findByText(/applicant list could not be verified/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
