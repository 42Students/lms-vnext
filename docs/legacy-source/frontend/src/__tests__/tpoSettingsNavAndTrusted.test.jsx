/**
 * TPO UX batch 1: Settings is a grouped section list (ten flat tabs overflowed and hid the last
 * ones), the page has one heading per section, and Trusted companies validates what is typed.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import TpoSettings from "@/pages/tpo/settings";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";

const mockRouter = { query: { tab: "trusted" }, pathname: "/tpo/settings", replace: jest.fn() };
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  getPlacementRules: jest.fn(), getWhatCompaniesSee: jest.fn(), listDrives: jest.fn(), listRecruiterAccess: jest.fn(),
  extendRecruiterAccess: jest.fn(), revokeRecruiterAccess: jest.fn(), savePlacementRules: jest.fn(), saveWhatCompaniesSee: jest.fn(),
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
  mockRouter.query = { tab: "trusted" };
  fetchWithErrorHandling.mockResolvedValue({ success: true, data: { trustedDomains: ["infosys.com"] } });
});

test("every section is reachable from a grouped list, and the open one is marked", async () => {
  render(<TpoSettings />);
  const nav = await screen.findByRole("navigation", { name: "Settings sections" });
  const shown = Array.from(nav.querySelectorAll("button")).map((b) => b.textContent);
  // Owner, 19 Oct 2026: only what is needed right now.
  expect(shown).toEqual(["Placement rules", "Job types", "After college", "Placement team", "Recruiters"]);
  expect(screen.queryByText("Students and companies")).not.toBeInTheDocument();
  // Trusted companies moved into Recruiters: the old link opens Recruiters.
  expect(nav.querySelector('[aria-current="page"]').textContent).toBe("Recruiters");
  // The placement team has its own Team module now (N13), not a Settings section.
  expect(Array.from(nav.querySelectorAll("button")).some((b) => b.textContent === "Team")).toBe(false);
});

test("choosing a section moves to it", async () => {
  render(<TpoSettings />);
  const nav = await screen.findByRole("navigation", { name: "Settings sections" });
  fireEvent.click(Array.from(nav.querySelectorAll("button")).find((b) => b.textContent === "Job types"));
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/tpo/settings", query: { tab: "jobtypes" } }, undefined, { shallow: true });
});

test("a link to a hidden section lands on Placement rules", async () => {
  for (const tab of ["prep", "blocked", "notices", "see", "webpage", "branding"]) {
    mockRouter.query = { tab };
    const { unmount } = render(<TpoSettings />);
    await screen.findByRole("button", { name: "Placement rules" });
    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    expect(nav.querySelector('[aria-current="page"]').textContent).toBe("Placement rules");
    unmount();
  }
});

test("a trusted domain must look like a domain and cannot be added twice", async () => {
  render(<TpoSettings />);
  const input = await screen.findByPlaceholderText("infosys.com");
  fireEvent.change(input, { target: { value: "infosys" } });
  expect(screen.getByText("Enter a company domain such as infosys.com.")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "@Infosys.COM" } });
  expect(screen.getByText("This domain is already trusted.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Trust @infosys.com/ })).toBeDisabled();
  fireEvent.change(input, { target: { value: "tcs.com" } });
  expect(screen.getByRole("button", { name: /Trust @tcs.com/ })).not.toBeDisabled();
});
