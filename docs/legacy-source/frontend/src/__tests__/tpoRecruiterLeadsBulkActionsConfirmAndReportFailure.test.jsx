/**
 * Engage (recruiter leads): bulk actions run from the Actions window (one button over the ticked rows, or the whole view), each
 * through the bulk engine: a preview with names and skipped rows, a result with failures, an exact undo and one audit line.
 * Before the Actions window these were a bulk bar (Batch 2 #12, Batch 12); the guarantees are the same.
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import TpoRecruiterLeadsPage from "@/pages/tpo/recruiters/index";
import { bulkInviteRecruiterLeads, bulkRecruiterLeadOwner, bulkRecruiterLeadStage, getCompanies, getFacultyDirectory, getTeam, getRecruiterLeadTable, getMailStatus, getSavedViews, recordBulk, restoreRecruiterLeads } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), query: {}, pathname: "/tpo/recruiters", replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1, firstName: "Asha" } }) }));
jest.mock("@/api/Services/TpoService", () => ({ listRecruiterAccess: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), addRecruiterLead: jest.fn(), checkRecruiterLead: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getTeam: jest.fn(() => Promise.resolve({ data: { status: "success", data: { members: [] } } })),
  bulkInviteRecruiterLeads: jest.fn(), bulkRecruiterLeadOwner: jest.fn(), bulkRecruiterLeadStage: jest.fn(),
  getMailStatus: jest.fn(), commitRecruiterLeadImport: jest.fn(), getCompanies: jest.fn(),
  getFacultyDirectory: jest.fn(), getRecruiterLeadTable: jest.fn(), previewRecruiterLeadImport: jest.fn(),
  getSavedViews: jest.fn(), saveView: jest.fn(), deleteView: jest.fn(), restoreRecruiterLeads: jest.fn(), recordBulk: jest.fn(),
  getCollegeSettings: jest.fn(() => Promise.resolve({ data: { status: "success", data: {} } })),
}));

const recruiterLeads = [
  { id: 1, name: "Priya Rao", companyName: "Acme", stage: "NEW", chips: [], ownerName: "", source: "Manual", lastActivityAt: null, nextFollowUp: null, inviteStatus: "NOT_SENT", drives: 0, studentsHired: 0, email: "priya@acme.com", recruiterId: null, unsubscribedAt: null },
  { id: 2, name: "Rahul Kumar", companyName: "Globex", stage: "NEW", chips: [], ownerName: "", source: "Manual", lastActivityAt: null, nextFollowUp: null, inviteStatus: "NOT_SENT", drives: 0, studentsHired: 0, email: "rahul@globex.com", recruiterId: null, unsubscribedAt: null },
];

// These render full pages with antd Selects/Modals; under a loaded CI/dev machine the default 5s is flaky.
jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
  getRecruiterLeadTable.mockResolvedValue({ data: { status: "success", data: recruiterLeads } });
  getCompanies.mockResolvedValue({ data: { status: "success", data: [] } });
  getMailStatus.mockResolvedValue({ data: { status: "success", data: { templates: { "recruiter-invite": true } } } });
  getSavedViews.mockResolvedValue({ data: { status: "success", data: [] } });
  recordBulk.mockResolvedValue({ data: { status: "success", data: { ok: true } } });
  restoreRecruiterLeads.mockResolvedValue({ data: { status: "success", data: { restored: 2 } } });
  getFacultyDirectory.mockResolvedValue({ data: { status: "success", data: [{ facultyId: 994001, firstName: "Tina", lastName: "Officer" }] } });
  // Owners are you, the college's TPO / admin accounts and the placement team (Settings > Team), never the whole faculty list.
  getTeam.mockResolvedValue({ data: { status: "success", data: { members: [{ facultyId: 994001, firstName: "Tina", lastName: "Officer" }] } } });
});

/** Tick every row, open the Actions window on them, and choose the action. */
const actOnAll = async (actionKey) => {
  render(<TpoRecruiterLeadsPage />);
  await screen.findByText("Priya Rao");
  await waitFor(() => expect(document.querySelectorAll(".ag-row .ag-selection-checkbox").length).toBeGreaterThan(1));
  fireEvent.click(document.querySelector(".ag-header-select-all input"));
  await waitFor(() => expect(screen.getByTestId("recruiter-leads.act")).toHaveTextContent("Act on 2 selected"));
  fireEvent.click(screen.getByTestId("recruiter-leads.act"));
  fireEvent.click(await screen.findByTestId(`recruiter-lead-actions.${actionKey}`));
};
const go = () => fireEvent.click(screen.getByTestId("recruiter-lead-actions.go"));

test("Mark contacted previews first, then reports a failure with its reason", async () => {
  bulkRecruiterLeadStage.mockRejectedValue({ response: { data: { message: "Server exploded" } } });
  await actOnAll("contacted");
  go();

  const preview = await screen.findByTestId("bulk.preview");
  expect(within(preview).getByText(/Priya Rao · Acme, Rahul Kumar · Globex/)).toBeInTheDocument();
  expect(bulkRecruiterLeadStage).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("bulk.confirm"));
  await waitFor(() => expect(bulkRecruiterLeadStage).toHaveBeenCalledWith({ recruiterLeadIds: [1, 2], stage: "CONTACTED" }));
  expect(await screen.findByText("Not done for 2 recruiters")).toBeInTheDocument();
  expect(screen.getAllByText(/Server exploded/).length).toBeGreaterThan(0);
  await waitFor(() => expect(recordBulk).toHaveBeenCalledWith(expect.objectContaining({ action: "Mark contacted", total: 2, done: 0, failed: 2 })));
});

test("Mark contacted reports what was done, and Undo puts every recruiter lead back exactly", async () => {
  bulkRecruiterLeadStage.mockResolvedValue({ data: { status: "success", data: {} } });
  await actOnAll("contacted");
  go();

  fireEvent.click(await screen.findByTestId("bulk.confirm"));
  await waitFor(() => expect(bulkRecruiterLeadStage).toHaveBeenCalled());
  expect(await screen.findByText("Done for 2 recruiters.")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("bulk.undo"));
  await waitFor(() => expect(restoreRecruiterLeads).toHaveBeenCalledWith([
    { id: 1, ownerId: null, manualStage: null, notNowReason: null, notNowUntil: null },
    { id: 2, ownerId: null, manualStage: null, notNowReason: null, notNowUntil: null },
  ]));
  expect(await screen.findByText("Undone for 2 recruiters.")).toBeInTheDocument();
  await waitFor(() => expect(recordBulk).toHaveBeenCalledWith(expect.objectContaining({ undone: true })));
});

test("Assign an owner requires picking a person, then actually calls the owner endpoint", async () => {
  bulkRecruiterLeadOwner.mockResolvedValue({ data: { status: "success", data: {} } });
  await actOnAll("owner");

  go(); // nobody picked: the window says so and nothing is sent
  expect(await screen.findByText("Choose the owner")).toBeInTheDocument();
  expect(bulkRecruiterLeadOwner).not.toHaveBeenCalled();

  fireEvent.mouseDown(document.querySelector(".ant-modal #ownerId").closest(".ant-select").querySelector(".ant-select-selector"));
  fireEvent.click(await screen.findByText("Tina Officer"));
  go();
  fireEvent.click(await screen.findByTestId("bulk.confirm"));
  await waitFor(() => expect(bulkRecruiterLeadOwner).toHaveBeenCalledWith([1, 2], 994001));
  expect(await screen.findByText("Done for 2 recruiters.")).toBeInTheDocument();
});

test("Invite by email names who is left out before anything is sent", async () => {
  recruiterLeads[1].recruiterId = 5001; // Rahul has already joined
  bulkInviteRecruiterLeads.mockResolvedValue({ data: { status: "success", data: { emailed: 1, skipped: 0 } } });
  await actOnAll("email");

  expect(screen.getByTestId("recruiter-lead-actions.left-out")).toHaveTextContent("Already joined: Rahul Kumar");
  go();
  expect(within(await screen.findByTestId("bulk.preview")).getByText("Priya Rao · Acme")).toBeInTheDocument();
  expect(bulkInviteRecruiterLeads).not.toHaveBeenCalled();
  recruiterLeads[1].recruiterId = null; // reset for other tests
});
