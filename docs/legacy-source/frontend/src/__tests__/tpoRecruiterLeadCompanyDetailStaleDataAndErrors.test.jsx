/**
 * UI/UX audit (Batch 2 #2/#3): both RecruiterLead Detail and Company Detail used to (a) show a toast and
 * then leave the page on a permanent skeleton on a genuine load failure, and (b) keep the
 * previous entity's data on screen for a moment when navigating directly from one id/name to
 * another (Previous/Next, or a typed URL).
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import TpoRecruiterLeadPage from "@/pages/tpo/recruiters/[recruiterLeadId]";
import TpoCompanyPage from "@/pages/tpo/companies";
import { getRecruiterLeadPage } from "@/api/Services/TpoHubService";
import { getCompanyDetail } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ addFollowUp: jest.fn(), logRecruiterLeadActivity: jest.fn(), markFollowUpDone: jest.fn(), markRecruiterLeadNotNow: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getRecruiterLeadPage: jest.fn(), getCompanyDetail: jest.fn(), getDriveCounts: jest.fn(() => Promise.resolve({ data: [] })) }));
// The company's Team conversation (Team module V1) has its own tests.
jest.mock("@/components/tpo/team/TeamConversation", () => function TeamConversationStub() { return null; });
jest.mock("@/components/tpo/team/useTeamPeople", () => () => ({ people: [], meId: 1 }));

const recruiterLeadA = { recruiterLead: { id: 1, name: "Priya Rao", stage: "NEW", companyName: "Acme", inviteStatus: "NOT_SENT" }, followUps: [], timeline: [], drives: [] };
const recruiterLeadB = { recruiterLead: { id: 2, name: "Rahul Kumar", stage: "NEW", companyName: "Globex", inviteStatus: "NOT_SENT" }, followUps: [], timeline: [], drives: [] };

describe("Lead Detail", () => {
  test("a failed load shows an inline error with Retry, not a permanent skeleton", async () => {
    useRouter.mockReturnValue({ query: { recruiterLeadId: "1" }, push: jest.fn() });
    getRecruiterLeadPage.mockRejectedValue({ response: { data: { message: "Lead not found" } } });
    render(<TpoRecruiterLeadPage />);
    expect(await screen.findByText("Lead not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });

  test("navigating directly from one lead to another clears the old lead's data first", async () => {
    useRouter.mockReturnValue({ query: { recruiterLeadId: "1" }, push: jest.fn() });
    getRecruiterLeadPage.mockResolvedValue({ data: { status: "success", data: recruiterLeadA } });
    const { rerender } = render(<TpoRecruiterLeadPage />);
    await screen.findByText("Priya Rao");

    let resolveB;
    getRecruiterLeadPage.mockReturnValue(new Promise((res) => { resolveB = res; }));
    useRouter.mockReturnValue({ query: { recruiterLeadId: "2" }, push: jest.fn() });
    rerender(<TpoRecruiterLeadPage />);

    // Priya (recruiter lead 1) must not still be on screen while recruiter lead 2 is loading.
    expect(screen.queryByText("Priya Rao")).not.toBeInTheDocument();

    resolveB({ data: { status: "success", data: recruiterLeadB } });
    await screen.findByText("Rahul Kumar");
  });
});

describe("Company Detail", () => {
  test("a failed load shows an inline error with Retry, not a permanent skeleton", async () => {
    useRouter.mockReturnValue({ query: { name: "Acme" }, push: jest.fn() });
    getCompanyDetail.mockRejectedValue({ response: { data: { message: "Company not found" } } });
    render(<TpoCompanyPage />);
    expect(await screen.findByText("Company not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });

  test("navigating directly from one company to another clears the old company's data first", async () => {
    useRouter.mockReturnValue({ query: { name: "Acme" }, push: jest.fn() });
    getCompanyDetail.mockResolvedValue({ data: { status: "success", data: { name: "Acme", people: [], hiredPerYear: [], documents: [], drives: [], timeline: [] } } });
    const { rerender } = render(<TpoCompanyPage />);
    // The redesign shows the company name in two places (header + summary card), so "Acme"
    // legitimately matches more than one element - assert on all of them, not a single match.
    await screen.findAllByText("Acme");

    let resolveB;
    getCompanyDetail.mockReturnValue(new Promise((res) => { resolveB = res; }));
    useRouter.mockReturnValue({ query: { name: "Globex" }, push: jest.fn() });
    rerender(<TpoCompanyPage />);

    expect(screen.queryAllByText("Acme")).toHaveLength(0);

    resolveB({ data: { status: "success", data: { name: "Globex", people: [], hiredPerYear: [], documents: [], drives: [], timeline: [] } } });
    await screen.findAllByText("Globex");
  });
});
