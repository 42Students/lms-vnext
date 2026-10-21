/** Settings audit: recruiter drive approval on/off, how long access lasts, and each recruiter's end date with Extend. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TpoSettings from "@/pages/tpo/settings";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { listRecruiterAccess } from "@/api/Services/TpoService";
import { getCollegeSettings, saveCollegeSettings } from "@/api/Services/TpoHubService";

// The full Settings page renders many antd sections; like the other TPO page tests, allow it more than 5s.
jest.setTimeout(30000);
const mockRouter = { query: { tab: "recruiters" }, pathname: "/tpo/settings", replace: jest.fn(), asPath: "/tpo/settings?tab=recruiters" };
jest.mock("next/router", () => ({ __esModule: true, default: { events: { on: jest.fn(), off: jest.fn() }, asPath: "/" }, useRouter: () => mockRouter }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  getPlacementRules: jest.fn(), getWhatCompaniesSee: jest.fn(), listDrives: jest.fn(), listRecruiterAccess: jest.fn(), extendRecruiterAccess: jest.fn(),
  revokeRecruiterAccess: jest.fn(), savePlacementRules: jest.fn(), saveWhatCompaniesSee: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  getPublicLink: jest.fn(() => Promise.resolve({ data: { status: "success", data: { enabled: false, postDirect: false, hasLink: false, opens: 0, joins: 0 } } })), newPublicLink: jest.fn(), savePublicLink: jest.fn(),
  getCollegeSettings: jest.fn(), getFacultyDirectory: jest.fn(), getMailStatus: jest.fn(),
  getMyPreferences: jest.fn(), getPrepCourses: jest.fn(), getRemovalImpact: jest.fn(), getSeasonSettings: jest.fn(),
  getTeam: jest.fn(), getStudentsTable: jest.fn(),
  removeTeamMember: jest.fn(), saveCollegeSettings: jest.fn(), saveMyPreferences: jest.fn(), setTeamMember: jest.fn(), updateSeason: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation(async (p) => ({ success: true, data: await p }));
  getCollegeSettings.mockResolvedValue({ recruiterDriveNeedsApproval: true, recruiterAccessMonths: 6 });
  saveCollegeSettings.mockResolvedValue({});
  listRecruiterAccess.mockResolvedValue([
    { recruiterId: 1, name: "Ravi", company: "Zoho", status: "ACTIVE", validUntil: "2027-04-04T10:00:00", expired: false },
    { recruiterId: 2, name: "Old", company: "Acme", status: "ACTIVE", validUntil: "2026-01-01T10:00:00", expired: true },
  ]);
});

test("approval switch saves, and each recruiter shows when access ends", async () => {
  render(<TpoSettings />);
  const sw = await screen.findByRole("switch", { name: "Approve each drive a recruiter requests" });
  expect(sw).toBeChecked();
  fireEvent.click(sw);
  await waitFor(() => expect(saveCollegeSettings).toHaveBeenCalledWith({ recruiterDriveNeedsApproval: false, recruiterAccessMonths: 6, recruiterSeesApplicants: "AFTER_REVIEW" }));
  // The list opens on who has access now; the ended ones are one tap away.
  expect(await screen.findByText("Until 4 Apr 2027")).toBeInTheDocument();
  expect(screen.queryByText("Ended 1 Jan 2026")).not.toBeInTheDocument();
  // Extend offers 3, 6 or 12 months or no end date, from one menu per recruiter.
  expect(screen.getAllByRole("button", { name: "Extend…" })).toHaveLength(1);
  fireEvent.click(screen.getByText(/^All \(2\)$/));
  expect(await screen.findByText("Ended 1 Jan 2026")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Give access again…" })).toBeInTheDocument();
});

test("recruiters see applicants after review by default, and the college can let them see applicants as they apply", async () => {
  render(<TpoSettings />);
  expect(await screen.findByText(/only once you share the applicant list/)).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Recruiters see applicants" }));
  fireEvent.click(await screen.findByText("As they apply"));
  await waitFor(() => expect(saveCollegeSettings).toHaveBeenCalledWith({ recruiterDriveNeedsApproval: true, recruiterAccessMonths: 6, recruiterSeesApplicants: "DIRECT" }));
  expect(await screen.findByText(/Email and phone stay hidden/)).toBeInTheDocument();
});
