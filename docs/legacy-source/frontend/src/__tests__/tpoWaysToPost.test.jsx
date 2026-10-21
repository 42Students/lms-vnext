/** Recruiter phase 1, N5: a college's company link (with the trusted switch) and inviting the recruiter to review a posted drive. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CompanyLinkCard from "@/components/tpo/company/CompanyLinkCard";
import InviteReviewer from "@/components/tpo/drive/InviteReviewer";
import { addCompanyDomain, getCompanyEngagement, newCompanyJoinLink, setCompanyTrusted } from "@/api/Services/TpoHubService";
import { inviteRecruiterToReview } from "@/api/Services/TpoService";

jest.mock("@/api/Services/TpoHubService", () => ({ getCompanyEngagement: jest.fn(), newCompanyJoinLink: jest.fn(), setCompanyTrusted: jest.fn(), addCompanyDomain: jest.fn(), getPublicLink: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ inviteRecruiterToReview: jest.fn() }));
jest.setTimeout(30000);
const ok = (data) => Promise.resolve({ data: { status: "success", data } });

beforeEach(() => jest.clearAllMocks());

test("the company link is made once, shown once, and the trusted switch saves", async () => {
  getCompanyEngagement.mockReturnValue(ok({ companyId: 40, trusted: false, hasLink: false, opens: 0, joins: 0, domains: ["omega.com"] }));
  newCompanyJoinLink.mockReturnValue(ok({ companyId: 40, trusted: false, hasLink: true, opens: 0, joins: 0, token: "abc" }));
  setCompanyTrusted.mockReturnValue(ok({ companyId: 40, trusted: true, hasLink: true, opens: 0, joins: 0 }));
  render(<CompanyLinkCard companyId={40} companyName="Omega" />);
  fireEvent.click(await screen.findByRole("button", { name: "Make a link" }));
  expect(await screen.findByLabelText("Company link")).toHaveValue(`${window.location.origin}/company-join/abc`);
  expect(screen.getByText(/shown only once/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("switch", { name: "Trusted company" }));
  await waitFor(() => expect(setCompanyTrusted).toHaveBeenCalledWith(40, true));
});

test("a link that exists shows how it is doing", async () => {
  getCompanyEngagement.mockReturnValue(ok({ companyId: 40, trusted: true, hasLink: true, linkCreatedAt: "2026-10-01T10:00:00", opens: 3, joins: 1 }));
  render(<CompanyLinkCard companyId={40} companyName="Omega" />);
  expect(await screen.findByText(/Opened 3 times, 1 joined/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "New link" })).toBeInTheDocument();
});

test("inviting the recruiter to review sends their work email and says what happens", async () => {
  inviteRecruiterToReview.mockReturnValue(ok({ status: "ATTACHED", recruiterName: "Kumar" }));
  const onDone = jest.fn();
  render(<InviteReviewer jobId={5} companyName="Omega" onDone={onDone} />);
  fireEvent.click(screen.getByRole("button", { name: "Invite the recruiter to review" }));
  fireEvent.change(await screen.findByLabelText("Recruiter's work email"), { target: { value: "kumar@omega.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
  await waitFor(() => expect(inviteRecruiterToReview).toHaveBeenCalledWith(5, { name: null, email: "kumar@omega.com", note: null, includePublicLink: false }));
  expect(await screen.findByText("Kumar can now review this drive")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(onDone).toHaveBeenCalled();
});

test("a company with no known email domain gets one before its link", async () => {
  getCompanyEngagement.mockReturnValue(ok({ companyId: 26, trusted: false, hasLink: false, opens: 0, joins: 0, domains: [] }));
  addCompanyDomain.mockReturnValue(ok({ companyId: 26, trusted: false, hasLink: false, opens: 0, joins: 0, domains: ["techmahindra.com"] }));
  render(<CompanyLinkCard companyId={26} companyName="Tech Mahindra" />);
  expect(await screen.findByRole("button", { name: "Make a link" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Company email domain"), { target: { value: "techmahindra.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Add domain" }));
  await waitFor(() => expect(addCompanyDomain).toHaveBeenCalledWith(26, "techmahindra.com"));
  expect(await screen.findByText("Email domains: @techmahindra.com")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Make a link" })).toBeEnabled();
});
