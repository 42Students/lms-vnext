/** Step 15 (N5 a, N6): the college's public link for recruiters, and the join page that asks for a company only when it is new. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PublicLinkCard from "@/components/tpo/settings/PublicLinkCard";
import CollegeJoinPage from "@/pages/college-join/[token]";
import { getPublicLink, newPublicLink, savePublicLink } from "@/api/Services/TpoHubService";
import { joinCollegeLink, previewCollegeJoin, sendCollegeJoinCode } from "@/api/Services/TpoService";

jest.setTimeout(30000);
jest.mock("next/router", () => ({ useRouter: () => ({ query: { token: "tok" }, push: jest.fn() }) }));
jest.mock("@/api/Services/TpoHubService", () => ({ getPublicLink: jest.fn(), newPublicLink: jest.fn(), savePublicLink: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ previewCollegeJoin: jest.fn(), sendCollegeJoinCode: jest.fn(), joinCollegeLink: jest.fn() }));
const ok = (data) => Promise.resolve({ data: { status: "success", data } });

beforeEach(() => jest.clearAllMocks());

test("the placement cell makes the link once and chooses whether business emails may post directly", async () => {
  getPublicLink.mockReturnValue(ok({ enabled: false, postDirect: false, hasLink: false, opens: 0, joins: 0 }));
  newPublicLink.mockReturnValue(ok({ enabled: true, postDirect: false, hasLink: true, opens: 0, joins: 0, token: "abc" }));
  savePublicLink.mockReturnValue(ok({ enabled: true, postDirect: true, hasLink: true, opens: 0, joins: 0 }));
  render(<PublicLinkCard />);
  fireEvent.click(await screen.findByRole("button", { name: "Make the link" }));
  expect(await screen.findByLabelText("Public link")).toHaveValue(`${window.location.origin}/college-join/abc`);
  fireEvent.click(screen.getByRole("switch", { name: "Anyone with a verified business email may post" }));
  await waitFor(() => expect(savePublicLink).toHaveBeenCalledWith({ postDirect: true }));
});

test("joining asks for the company name only when the email's company is new", async () => {
  previewCollegeJoin.mockResolvedValue({ data: { collegeName: "NSRIT" } });
  sendCollegeJoinCode.mockResolvedValue({ data: { status: "CODE_SENT", email: "kumar@newco.in", companyName: null } });
  joinCollegeLink.mockResolvedValue({ data: { status: "JOINED", collegeName: "NSRIT", signInEmail: "kumar@newco.in" } });
  render(<CollegeJoinPage />);
  expect(await screen.findByText("Hire from NSRIT")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "kumar@newco.in" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Kumar" } });
  fireEvent.click(screen.getByRole("button", { name: "Send me a code" }));
  fireEvent.change(await screen.findByLabelText("Company name"), { target: { value: "NewCo" } });
  fireEvent.change(screen.getByLabelText("Code sent to kumar@newco.in"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: /Join NSRIT placements/ }));
  await waitFor(() => expect(joinCollegeLink).toHaveBeenCalledWith("tok", expect.objectContaining({ email: "kumar@newco.in", companyName: "NewCo", code: "123456" })));
  expect(await screen.findByText("You now have access to NSRIT")).toBeInTheDocument();
});
