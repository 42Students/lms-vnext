/**
 * Settings: there is no season (registration is per batch on Batches). Blocked dates are hidden for now (owner, 19 Oct 2026):
 * the section is not listed and an old link opens Placement rules; the panel and its saved dates stay for when it comes back.
 */
import React from "react";
import { render, screen, within } from "@testing-library/react";
import TpoSettings from "@/pages/tpo/settings";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";

const mockRouter = { query: { tab: "blocked" }, pathname: "/tpo/settings", replace: jest.fn() };
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
  getTeam: jest.fn(), getStudentsTable: jest.fn(), getCgpaRule: jest.fn(), saveCgpaRule: jest.fn(),
  removeTeamMember: jest.fn(), saveCollegeSettings: jest.fn(), saveMyPreferences: jest.fn(), setTeamMember: jest.fn(), updateSeason: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation(async (p) => ({ success: true, data: (await p) ?? {} }));
});

test("no Season and no Blocked dates section for now; the old link opens Placement rules", async () => {
  render(<TpoSettings />);
  await screen.findByRole("button", { name: "Placement rules" });
  const nav = screen.getByRole("navigation", { name: "Settings sections" });
  expect(within(nav).queryByText("Season")).not.toBeInTheDocument();
  expect(within(nav).queryByText("Blocked dates")).not.toBeInTheDocument();
  expect(nav.querySelector('[aria-current="page"]').textContent).toBe("Placement rules");
});
