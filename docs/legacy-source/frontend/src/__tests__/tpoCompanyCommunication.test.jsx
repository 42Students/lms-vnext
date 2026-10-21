/** Recruiter phase 1, N11: Engage > Companies shows and saves where the placement cell is with each company. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TpoRecruiterLeadsPage from "@/pages/tpo/recruiters/index";
import { getCompanies, getMailStatus, getRecruiterLeadTable, getSavedViews, setCompanyCommunication } from "@/api/Services/TpoHubService";

jest.setTimeout(30000);
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), query: { view: "companies" }, pathname: "/tpo/recruiters" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1, firstName: "Asha" } }) }));
jest.mock("@/api/Services/TpoService", () => ({ listRecruiterAccess: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), addRecruiterLead: jest.fn(), checkRecruiterLead: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getTeam: jest.fn(() => Promise.resolve({ data: { status: "success", data: { members: [] } } })),
  bulkInviteRecruiterLeads: jest.fn(), bulkRecruiterLeadOwner: jest.fn(), bulkRecruiterLeadStage: jest.fn(),
  getMailStatus: jest.fn(), commitRecruiterLeadImport: jest.fn(), getCompanies: jest.fn(),
  getFacultyDirectory: jest.fn(), getRecruiterLeadTable: jest.fn(), previewRecruiterLeadImport: jest.fn(),
  getSavedViews: jest.fn(), saveView: jest.fn(), deleteView: jest.fn(), restoreRecruiterLeads: jest.fn(), setCompanyCommunication: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getRecruiterLeadTable.mockResolvedValue({ data: { status: "success", data: [] } });
  getCompanies.mockResolvedValue({ data: { status: "success", data: [{ key: "omega", name: "Omega", people: [], drives: 0, studentsHired: 0, communication: "EMAILED" }] } });
  getMailStatus.mockResolvedValue({ data: { status: "success", data: { templates: {} } } });
  getSavedViews.mockResolvedValue({ data: { status: "success", data: [] } });
  setCompanyCommunication.mockResolvedValue({ data: { status: "success", data: { communication: "MEETING_SET" } } });
});

test("each company shows its communication status and it can be changed in place", async () => {
  render(<TpoRecruiterLeadsPage />);
  const select = await screen.findByRole("combobox", { name: "Communication with Omega" });
  expect(screen.getAllByText("Emailed").length).toBeGreaterThan(0);
  fireEvent.mouseDown(select);
  fireEvent.click(await screen.findByText("Meeting set"));
  await waitFor(() => expect(setCompanyCommunication).toHaveBeenCalledWith("Omega", "MEETING_SET"));
});
