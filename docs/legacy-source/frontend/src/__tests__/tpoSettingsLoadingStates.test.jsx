/**
 * UI/UX brutal-audit round 3: TPO Settings never shows the admin sections before the access check answers, and an unanswered
 * check says so and retries. (The blocked-dates loading tests went with that section, hidden on 19 Oct 2026.)
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import TpoSettings from "@/pages/tpo/settings";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getSeasonSettings } from "@/api/Services/TpoService";
import { getTeam } from "@/api/Services/TpoHubService";

const mockRouter = { query: { tab: "rules" }, pathname: "/tpo/settings", replace: jest.fn() };
jest.mock("next/router", () => ({ __esModule: true, default: { events: { on: jest.fn(), off: jest.fn() }, asPath: "/" }, useRouter: () => mockRouter }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  getPlacementRules: jest.fn(), getWhatCompaniesSee: jest.fn(), listDrives: jest.fn(), listRecruiterAccess: jest.fn(),
  extendRecruiterAccess: jest.fn(), revokeRecruiterAccess: jest.fn(), savePlacementRules: jest.fn(), saveWhatCompaniesSee: jest.fn(),
  getSeasonSettings: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  getPublicLink: jest.fn(() => Promise.resolve({ data: { status: "success", data: { enabled: false, postDirect: false, hasLink: false, opens: 0, joins: 0 } } })), newPublicLink: jest.fn(), savePublicLink: jest.fn(),
  getCollegeSettings: jest.fn(), getFacultyDirectory: jest.fn(), getMailStatus: jest.fn(),
  getMyPreferences: jest.fn(), getPrepCourses: jest.fn(), getRemovalImpact: jest.fn(), getSeasonSettings: jest.fn(),
  getTeam: jest.fn(), getStudentsTable: jest.fn(), getCgpaRule: jest.fn(),
  removeTeamMember: jest.fn(), saveCollegeSettings: jest.fn(), saveMyPreferences: jest.fn(), setTeamMember: jest.fn(), updateSeason: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getSeasonSettings.mockResolvedValue({});
});

test("an unanswered access check never shows the admin settings; it says so and retries", async () => {
  getTeam.mockReturnValue("TEAM");
  fetchWithErrorHandling.mockImplementation(async (call) => (call === "TEAM"
    ? { success: false, status: 503, data: { message: "Team service unavailable" } }
    : { success: true, data: {} }));
  render(<TpoSettings />);

  expect(await screen.findByText("Team service unavailable")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Settings sections" })).not.toBeInTheDocument();

  fetchWithErrorHandling.mockImplementation(async () => ({ success: true, data: {} }));
  fireEvent.click(screen.getByRole("button", { name: /Retry/i }));
  expect(await screen.findByRole("navigation", { name: "Settings sections" })).toBeInTheDocument();
});
