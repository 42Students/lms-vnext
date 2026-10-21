/**
 * UI/UX audit (Batch 2 #2/#4/#6): a failed RecruiterLeads load used to only show a toast, leaving the page
 * on an indefinite empty table with no way to tell "no recruiter leads" from "load failed"; a Companies
 * failure inside the same combined refresh was swallowed entirely and looked like "Companies (0)";
 * and an unknown ?view= rendered nothing meaningful instead of falling back to Table.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import TpoRecruiterLeadsPage from "@/pages/tpo/recruiters/index";
import { getCompanies, getFacultyDirectory, getRecruiterLeadTable, getMailStatus, getSavedViews } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), query: { view: "nonsense" }, pathname: "/tpo/recruiters", replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1, firstName: "Asha" } }) }));
jest.mock("@/api/Services/TpoService", () => ({ listRecruiterAccess: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), addRecruiterLead: jest.fn(), checkRecruiterLead: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getTeam: jest.fn(() => Promise.resolve({ data: { status: "success", data: { members: [] } } })), 
  bulkInviteRecruiterLeads: jest.fn(), bulkRecruiterLeadOwner: jest.fn(), bulkRecruiterLeadStage: jest.fn(),
  getMailStatus: jest.fn(), commitRecruiterLeadImport: jest.fn(), getCompanies: jest.fn(),
  getFacultyDirectory: jest.fn(), getRecruiterLeadTable: jest.fn(), previewRecruiterLeadImport: jest.fn(),
  getSavedViews: jest.fn(), saveView: jest.fn(), deleteView: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getMailStatus.mockResolvedValue({ data: { status: "success", data: { templates: {} } } });
  getSavedViews.mockResolvedValue({ data: { status: "success", data: [] } });
  getFacultyDirectory.mockResolvedValue({ data: { status: "success", data: [] } });
});

test("a failed leads load shows an inline error with Retry, not an empty table forever", async () => {
  getRecruiterLeadTable.mockRejectedValue({ response: { data: { message: "Timed out" } } });
  getCompanies.mockResolvedValue({ data: { status: "success", data: [] } });
  render(<TpoRecruiterLeadsPage />);
  expect(await screen.findByText("Timed out")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  expect(screen.queryByText("No leads yet")).not.toBeInTheDocument();
});

test("a failed companies load doesn't silently look like zero companies", async () => {
  getRecruiterLeadTable.mockResolvedValue({ data: { status: "success", data: [] } });
  getCompanies.mockRejectedValue({ response: { data: { message: "Companies service down" } } });
  render(<TpoRecruiterLeadsPage />);
  expect(await screen.findByText("Companies could not be loaded")).toBeInTheDocument();
  expect(screen.getByText("Companies service down")).toBeInTheDocument();
});

test("an unknown ?view= falls back to Table instead of showing nothing", async () => {
  getRecruiterLeadTable.mockResolvedValue({ data: { status: "success", data: [] } });
  getCompanies.mockResolvedValue({ data: { status: "success", data: [] } });
  render(<TpoRecruiterLeadsPage />);
  const tableTab = await screen.findByRole("tab", { name: "Table" });
  expect(tableTab).toHaveAttribute("aria-selected", "true");
});
