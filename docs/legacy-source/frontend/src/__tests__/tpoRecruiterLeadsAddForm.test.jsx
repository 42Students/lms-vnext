/**
 * RecruiterLeads audit (L5): Add recruiter lead takes an email and a phone (either is enough), a designation, and an
 * optional first follow-up, so a new recruiter lead does not start out flagged "No next step".
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import TpoRecruiterLeadsPage from "@/pages/tpo/recruiters/index";
import { addFollowUp, addRecruiterLead, checkRecruiterLead } from "@/api/Services/TpoService";
import { getCompanies, getRecruiterLeadTable, getMailStatus, getSavedViews } from "@/api/Services/TpoHubService";

let mockQuery = { add: "1" };
jest.mock("next/router", () => ({ __esModule: true, default: { events: { on: jest.fn(), off: jest.fn() }, asPath: "/" }, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), query: mockQuery, pathname: "/tpo/recruiters" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1, firstName: "Asha" } }) }));
jest.mock("@/api/Services/TpoService", () => ({ listRecruiterAccess: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), addRecruiterLead: jest.fn(), addFollowUp: jest.fn(), checkRecruiterLead: jest.fn(), inviteRecruiterLead: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getTeam: jest.fn(() => Promise.resolve({ data: { status: "success", data: { members: [] } } })), 
  bulkInviteRecruiterLeads: jest.fn(), bulkRecruiterLeadOwner: jest.fn(), bulkRecruiterLeadStage: jest.fn(),
  getMailStatus: jest.fn(), commitRecruiterLeadImport: jest.fn(), getCompanies: jest.fn(), getCollegeSettings: jest.fn(() => Promise.resolve({ data: { status: "success", data: {} } })),
  getFacultyDirectory: jest.fn(), getRecruiterLeadTable: jest.fn(), previewRecruiterLeadImport: jest.fn(),
  getSavedViews: jest.fn(), saveView: jest.fn(), deleteView: jest.fn(),
}));

// Full pages with antd forms; under a loaded full-suite run the default 5s is flaky.
jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = { add: "1" };
  getRecruiterLeadTable.mockResolvedValue({ data: { status: "success", data: [] } });
  getCompanies.mockResolvedValue({ data: { status: "success", data: [] } });
  getMailStatus.mockResolvedValue({ data: { status: "success", data: { templates: {} } } });
  getSavedViews.mockResolvedValue({ data: { status: "success", data: [] } });
  checkRecruiterLead.mockResolvedValue({ data: { status: "success", data: null } });
  addRecruiterLead.mockResolvedValue({ data: { status: "success", data: { id: 77 } } });
});

const type = (id, value) => fireEvent.change(screen.getByRole("dialog").querySelector(`input[id="${id}"]`), { target: { value } });

test("both contacts and the designation are sent, both are checked for duplicates, and the button says Add lead", async () => {
  render(<TpoRecruiterLeadsPage />);
  await screen.findByRole("dialog");
  type("name", "Ravi Kumar");
  type("designation", "HR Manager");
  type("email", "ravi@acme.com");
  type("phone", "9876543210");
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add recruiter lead" }));
  await waitFor(() => expect(addRecruiterLead).toHaveBeenCalled());
  expect(checkRecruiterLead).toHaveBeenCalledWith("ravi@acme.com");
  expect(checkRecruiterLead).toHaveBeenCalledWith("9876543210");
  expect(addRecruiterLead).toHaveBeenCalledWith({ name: "Ravi Kumar", companyName: "Acme", designation: "HR Manager", emailOrPhone: "ravi@acme.com", otherContact: "9876543210", source: null });
  expect(addFollowUp).not.toHaveBeenCalled();
});

test("a phone alone is enough, and with neither contact the form says what is missing", async () => {
  render(<TpoRecruiterLeadsPage />);
  await screen.findByRole("dialog");
  type("name", "Asha");
  type("companyName", "Orbit");
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add recruiter lead" }));
  expect(await screen.findByText("Add an email or a phone")).toBeInTheDocument();
  expect(addRecruiterLead).not.toHaveBeenCalled();
  type("phone", "9876543210");
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add recruiter lead" }));
  await waitFor(() => expect(addRecruiterLead).toHaveBeenCalledWith(expect.objectContaining({ emailOrPhone: "9876543210", otherContact: null })));
});

test("a company with drives but no contact offers Add a contact, prefilled with the company", async () => {
  getCompanies.mockResolvedValue({ data: { status: "success", data: [{ key: "zoho", name: "Zoho", people: [], drives: 2, studentsHired: 0 }] } });
  mockQuery = { view: "companies" };
  render(<TpoRecruiterLeadsPage />);
  fireEvent.click(await screen.findByText("Add a contact"));
  await waitFor(() => expect(document.querySelector('input[id="companyName"]')).toHaveValue("Zoho"));
});
