/**
 * PVN-B009: cancelling a drive now really ends open applicants, cancels their interviews and
 * settles pending withdrawals (TpoDriveService.cancel). The confirmation must say exactly that,
 * with the real counts, instead of the old generic "applicants will be told".
 */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Modal } from "antd";
import { useRouter } from "next/router";
import TpoDrivePage from "@/pages/tpo/drives/[jobId]";
import { getDrive, getNotApplied } from "@/api/Services/TpoService";
import {
  getDriveActivity, getEligibilityPreview, getWorkspaceApplicants, getWorkspaceOffers, getWorkspaceRounds, getWorkspaceSummary,
} from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/components/tpo/drive/ApplicantsTab", () => function ApplicantsTabStub() { return <div />; });
jest.mock("@/components/tpo/drive/RoundsTab", () => function RoundsTabStub() { return <div />; });
jest.mock("@/components/tpo/drive/OffersTab", () => function OffersTabStub() { return <div />; });
jest.mock("@/components/tpo/drive/OverviewTab", () => function OverviewTabStub() { return <div />; });
jest.mock("@/api/Services/TpoService", () => ({
  approveDrive: jest.fn(), cancelDrive: jest.fn(), closeDrive: jest.fn(), extendDeadline: jest.fn(), getDrive: jest.fn(),
  getNotApplied: jest.fn(), publishDrive: jest.fn(), rejectDrive: jest.fn(), sendBackDrive: jest.fn(),
  listChangeRequests: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), createChangeRequest: jest.fn(), acceptChangeRequest: jest.fn(),
  answerChangeRequest: jest.fn(), replyChangeRequest: jest.fn(), withdrawChangeRequest: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  approveAndPublishDrive: jest.fn(), getDriveActivity: jest.fn(), getEligibilityPreview: jest.fn(),
  getWorkspaceApplicants: jest.fn(), getWorkspaceOffers: jest.fn(), getWorkspaceRounds: jest.fn(), getWorkspaceSummary: jest.fn(),
}));

jest.setTimeout(30000);
const ok = (data) => ({ data: { status: "success", data } });

afterEach(() => { Modal.destroyAll(); });

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ query: { jobId: "1" }, push: jest.fn(), pathname: "/tpo/drives/1", replace: jest.fn() });
  getDrive.mockResolvedValue(ok({ id: 1, companyName: "Acme", jobTitle: "SDE", lifecycleStatus: "PUBLISHED", driveMode: "ON_CAMPUS", recruiterId: 7 }));
  getNotApplied.mockResolvedValue(ok([]));
  getWorkspaceRounds.mockResolvedValue(ok([]));
  getWorkspaceSummary.mockResolvedValue(ok({}));
  getDriveActivity.mockResolvedValue(ok([]));
  getEligibilityPreview.mockResolvedValue(ok({ eligible: 0, excluded: 0 }));
});

test("the cancel confirmation states real counts, interview cleanup, withdrawals and untouched offers", async () => {
  getWorkspaceApplicants.mockResolvedValue(ok([
    { applicationId: 1, learnerId: 10, stage: "APPLIED" },
    { applicationId: 2, learnerId: 11, stage: "INTERVIEW" },
    { applicationId: 3, learnerId: 12, stage: "WAITLISTED" },
    { applicationId: 4, learnerId: 13, stage: "REJECTED" },
  ]));
  getWorkspaceOffers.mockResolvedValue(ok([{ id: 1, status: "RELEASED" }]));
  render(<TpoDrivePage />);

  fireEvent.click(await screen.findByText("More"));
  fireEvent.click(await screen.findByText("Cancel drive"));

  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/3 open applicants/)).toBeInTheDocument();
  expect(within(dialog).getByText(/and the recruiter is told too/)).toBeInTheDocument();
  expect(within(dialog).getByText(/1 applicant is in the interview stage/)).toBeInTheDocument();
  expect(within(dialog).getByText(/Pending withdrawal requests on this drive are approved/)).toBeInTheDocument();
  expect(within(dialog).getByText(/1 released or accepted offer stay as they are/)).toBeInTheDocument();
});

test("no interview-stage applicants and no offers means those lines are not shown", async () => {
  getWorkspaceApplicants.mockResolvedValue(ok([{ applicationId: 1, learnerId: 10, stage: "APPLIED" }]));
  getWorkspaceOffers.mockResolvedValue(ok([]));
  render(<TpoDrivePage />);

  fireEvent.click(await screen.findByText("More"));
  fireEvent.click(await screen.findByText("Cancel drive"));

  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/1 open applicant/)).toBeInTheDocument();
  expect(within(dialog).queryByText(/interview stage/)).not.toBeInTheDocument();
  expect(within(dialog).queryByText(/stay as they are/)).not.toBeInTheDocument();
});
