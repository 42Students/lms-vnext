/**
 * UI/UX audit follow-up (SHELL-12): +New from a company page passes ?company= through to the
 * recruiter leads page's add-recruiter lead modal - this proves the company name actually lands in the form field,
 * not just that the modal opens empty.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import TpoRecruiterLeadsPage from "@/pages/tpo/recruiters/index";
import { getCompanies, getRecruiterLeadTable, getMailStatus, getSavedViews } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), query: { add: "1", company: "Acme" }, pathname: "/tpo/recruiters" }) }));
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
  getRecruiterLeadTable.mockResolvedValue({ data: { status: "success", data: [] } });
  getCompanies.mockResolvedValue({ data: { status: "success", data: [] } });
  getMailStatus.mockResolvedValue({ data: { status: "success", data: { templates: {} } } });
  getSavedViews.mockResolvedValue({ data: { status: "success", data: [] } });
});

test("opening add-lead via ?add=1&company=Acme prefills the Company field", async () => {
  render(<TpoRecruiterLeadsPage />);
  const modal = await screen.findByRole("dialog");
  expect(modal).toBeInTheDocument();
  const companyInput = document.querySelector('input[id$="companyName"]');
  expect(companyInput).toHaveValue("Acme");
});
