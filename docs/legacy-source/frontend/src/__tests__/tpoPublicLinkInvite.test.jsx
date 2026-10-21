/**
 * The public link in drive invitations, and the audit of the three recruiter settings
 * (backend docs/recruiter-global/PUBLIC-LINK-AND-RECRUITER-RULES-AUDIT-2026-10-13.md).
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PublicLinkCard from "@/components/tpo/settings/PublicLinkCard";
import InviteReviewer from "@/components/tpo/drive/InviteReviewer";
import CollegeJoinPage from "@/pages/college-join/[token]";
import { getPublicLink, newPublicLink, savePublicLink } from "@/api/Services/TpoHubService";
import { inviteRecruiterToReview, joinCollegeLink, previewCollegeJoin, sendCollegeJoinCode } from "@/api/Services/TpoService";

jest.setTimeout(30000);
jest.mock("next/router", () => ({ useRouter: () => ({ query: { token: "tok" }, push: jest.fn() }) }));
jest.mock("@/api/Services/TpoHubService", () => ({ getPublicLink: jest.fn(), newPublicLink: jest.fn(), savePublicLink: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ inviteRecruiterToReview: jest.fn(), previewCollegeJoin: jest.fn(), sendCollegeJoinCode: jest.fn(), joinCollegeLink: jest.fn() }));
const ok = (data) => Promise.resolve({ data: { status: "success", data } });
const LINK = { enabled: true, postDirect: false, hasLink: true, opens: 2, joins: 1, createdAt: "2026-10-01T10:00:00", token: "pub" };

beforeEach(() => jest.clearAllMocks());

test("the public link can be copied any time, not only when it is made", async () => {
  getPublicLink.mockReturnValue(ok(LINK));
  render(<PublicLinkCard />);
  expect(await screen.findByLabelText("Public link")).toHaveValue(`${window.location.origin}/college-join/pub`);
  expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  expect(screen.queryByText(/shown only once/)).toBeNull();
});

test("a link made before links could be shown again asks for a new one", async () => {
  getPublicLink.mockReturnValue(ok({ ...LINK, token: null }));
  render(<PublicLinkCard />);
  expect(await screen.findByText("This link was made before links could be shown again")).toBeInTheDocument();
  expect(screen.queryByLabelText("Public link")).toBeNull();
});

test("direct posting says what really happens: drafts the TPO still publishes", async () => {
  getPublicLink.mockReturnValue(ok({ ...LINK, postDirect: true }));
  render(<PublicLinkCard />);
  expect(await screen.findByText(/skip your approval and arrive as drafts. You still publish them/)).toBeInTheDocument();
  expect(screen.queryByText(/go live without your review/)).toBeNull();
});

test("the invitation carries the public link and, when it can't be emailed, hands over the email to send", async () => {
  getPublicLink.mockReturnValue(ok(LINK));
  inviteRecruiterToReview.mockReturnValue(ok({
    status: "INVITED", emailed: false, recruiterLeadId: 9, inviteLink: "https://x/recruiter-invite/t", publicLink: "https://x/college-join/pub", publicLinkIncluded: true,
    email: { to: "kumar@omega.com", subject: "Please review GET at NSRIT", body: "Hello Kumar,\n\nhttps://x/recruiter-invite/t\n\nhttps://x/college-join/pub" },
  }));
  const onDone = jest.fn();
  render(<InviteReviewer jobId={5} companyName="Omega" onDone={onDone} />);
  fireEvent.click(screen.getByRole("button", { name: "Invite the recruiter to review" }));
  const box = await screen.findByRole("checkbox", { name: /Add our public link for others at Omega/ });
  await waitFor(() => expect(box).toBeChecked());
  fireEvent.change(screen.getByLabelText("Recruiter's work email"), { target: { value: "kumar@omega.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
  await waitFor(() => expect(inviteRecruiterToReview).toHaveBeenCalledWith(5, { name: null, email: "kumar@omega.com", note: null, includePublicLink: true }));
  expect(await screen.findByText("Your invitation is ready. Send it from your email.")).toBeInTheDocument();
  expect(screen.getByLabelText("Email to send").value).toContain("https://x/college-join/pub");
  const open = screen.getByRole("link", { name: "Open in my email" });
  expect(open.getAttribute("href")).toMatch(/^mailto:kumar%40omega\.com\?subject=Please%20review%20GET%20at%20NSRIT&body=/);
  expect(onDone).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(onDone).toHaveBeenCalled();
});

test("a link that is off can't be added, and the screen says why", async () => {
  getPublicLink.mockReturnValue(ok({ ...LINK, enabled: false }));
  render(<InviteReviewer jobId={5} companyName="Omega" />);
  fireEvent.click(screen.getByRole("button", { name: "Invite the recruiter to review" }));
  expect(await screen.findByText(/Your public link is off/)).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: /Add our public link/ })).toBeDisabled();
  expect(screen.getByRole("checkbox", { name: /Add our public link/ })).not.toBeChecked();
});

const fillJoin = async () => {
  expect(await screen.findByText("Hire from NSRIT")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "kumar@newco.in" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Kumar" } });
  fireEvent.click(screen.getByRole("button", { name: "Send me a code" }));
  fireEvent.change(await screen.findByLabelText("Company name"), { target: { value: "Infosys" } });
  fireEvent.change(screen.getByLabelText("Code sent to kumar@newco.in"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: /Join NSRIT placements/ }));
};

test("a stranger can't join under the name of a company already on the list", async () => {
  previewCollegeJoin.mockResolvedValue({ data: { collegeName: "NSRIT" } });
  sendCollegeJoinCode.mockResolvedValue({ data: { status: "CODE_SENT", email: "kumar@newco.in", companyName: null } });
  joinCollegeLink.mockRejectedValue({ response: { status: 400, data: { error: "COMPANY_EXISTS", message: "Infosys Limited is already on 42's company list with its own email domain." } } });
  render(<CollegeJoinPage />);
  await fillJoin();
  expect(await screen.findByText(/Infosys Limited is already on 42's company list/)).toBeInTheDocument();
});

test("joining again says they already have access", async () => {
  previewCollegeJoin.mockResolvedValue({ data: { collegeName: "NSRIT" } });
  sendCollegeJoinCode.mockResolvedValue({ data: { status: "CODE_SENT", email: "kumar@newco.in", companyName: null } });
  joinCollegeLink.mockResolvedValue({ data: { status: "ALREADY_JOINED", collegeName: "NSRIT", signInEmail: "kumar@newco.in" } });
  render(<CollegeJoinPage />);
  await fillJoin();
  expect(await screen.findByText("You already have access to NSRIT")).toBeInTheDocument();
});

test("a removed recruiter is told, not let back in", async () => {
  previewCollegeJoin.mockResolvedValue({ data: { collegeName: "NSRIT" } });
  sendCollegeJoinCode.mockResolvedValue({ data: { status: "CODE_SENT", email: "kumar@newco.in", companyName: null } });
  joinCollegeLink.mockRejectedValue({ response: { status: 400, data: { error: "ACCESS_REMOVED", message: "The placement cell removed your access to this college." } } });
  render(<CollegeJoinPage />);
  await fillJoin();
  expect(await screen.findByText(/removed your access/)).toBeInTheDocument();
  expect(savePublicLink).not.toHaveBeenCalled();
  expect(newPublicLink).not.toHaveBeenCalled();
});

test("the invitation's email field says it is for inviting and hidden from students, and takes the email typed in Add a company", async () => {
  getPublicLink.mockReturnValue(ok(LINK));
  render(<InviteReviewer jobId={5} companyName="Omega" defaultEmail="priya@omega.com" />);
  fireEvent.click(screen.getByRole("button", { name: "Invite the recruiter to review" }));
  expect(await screen.findByLabelText("This is for inviting the recruiter to the drive. It is hidden from the students.")).toBeInTheDocument();
  expect(screen.getByLabelText("Recruiter's work email")).toHaveValue("priya@omega.com");
});
