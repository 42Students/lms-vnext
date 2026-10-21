/**
 * UI/UX audit, Tier C "Publish Pre-flight" (2026-10-01): the Publish confirm modal must actually
 * disable its OK button when the checklist has a blocking item, and the REQUEST-path "Approve and
 * publish" shortcut - previously a single click with zero confirmation at all - must go through
 * the exact same gate as an ordinary Publish.
 */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useRouter } from "next/router";
import TpoDrivePage from "@/pages/tpo/drives/[jobId]";
import { getDrive, getNotApplied, publishDrive } from "@/api/Services/TpoService";
import {
  approveAndPublishDrive, getDriveActivity, getEligibilityPreview, getWorkspaceApplicants, getWorkspaceOffers, getWorkspaceRounds, getWorkspaceSummary,
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
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  approveAndPublishDrive: jest.fn(), getDriveActivity: jest.fn(), getEligibilityPreview: jest.fn(),
  getWorkspaceApplicants: jest.fn(), getWorkspaceOffers: jest.fn(), getWorkspaceRounds: jest.fn(), getWorkspaceSummary: jest.fn(),
}));

const mockSections = (rounds = []) => {
  getWorkspaceApplicants.mockResolvedValue({ data: { status: "success", data: [] } });
  getNotApplied.mockResolvedValue({ data: { status: "success", data: [] } });
  getWorkspaceRounds.mockResolvedValue({ data: { status: "success", data: rounds } });
  getWorkspaceOffers.mockResolvedValue({ data: { status: "success", data: [] } });
  getWorkspaceSummary.mockResolvedValue({ data: { status: "success", data: {} } });
  getDriveActivity.mockResolvedValue({ data: { status: "success", data: [] } });
  getEligibilityPreview.mockResolvedValue({ data: { status: "success", data: { eligible: 40, excluded: 2 } } });
};

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ query: { jobId: "1" }, push: jest.fn(), pathname: "/tpo/drives/1", replace: jest.fn() });
});

test("a DRAFT drive missing CTC and deadline shows blockers and disables Publish", async () => {
  mockSections([]);
  getDrive.mockResolvedValue({ data: { status: "success", data: {
    id: 1, companyName: "Acme", jobTitle: "SDE", lifecycleStatus: "DRAFT", driveMode: "ON_CAMPUS", roleOptionsJson: [{ name: "Default" }], eligibilityJson: {},
  } } });
  render(<TpoDrivePage />);
  fireEvent.click((await screen.findAllByText("Publish"))[0]); // the header button; the Next step card offers the same
  expect(await screen.findByText("Fix these before publishing")).toBeInTheDocument();
  expect(screen.getByText("No pay (CTC or stipend) set for any package")).toBeInTheDocument();
  expect(screen.getByText("No application deadline set")).toBeInTheDocument();
  expect(screen.getByText("No interview rounds added yet")).toBeInTheDocument();
  const dialog = await screen.findByRole("dialog");
  const okButton = within(dialog).getByRole("button", { name: "Publish" });
  expect(okButton).toBeDisabled();
  fireEvent.click(okButton);
  expect(publishDrive).not.toHaveBeenCalled();
});

test("a fully set up DRAFT drive publishes with no blockers", async () => {
  mockSections([{ id: 9, seq: 1, name: "Screening" }]);
  publishDrive.mockResolvedValue({ data: { status: "success", data: {} } });
  getDrive.mockResolvedValue({ data: { status: "success", data: {
    id: 1, companyName: "Acme", jobTitle: "SDE", lifecycleStatus: "DRAFT", driveMode: "ON_CAMPUS",
    jobType: "FULL_TIME", roleOptionsJson: [{ name: "Default", ctcLpa: 8 }], eligibilityJson: { minCgpa: 6.5 }, applicationDeadline: "2099-12-01T00:00:00",
  } } });
  render(<TpoDrivePage />);
  fireEvent.click((await screen.findAllByText("Publish"))[0]); // the header button; the Next step card offers the same
  await screen.findByText(/students/);
  expect(screen.queryByText("Fix these before publishing")).not.toBeInTheDocument();
  const dialog = await screen.findByRole("dialog");
  const okButton = within(dialog).getByRole("button", { name: "Publish" });
  expect(okButton).not.toBeDisabled();
  fireEvent.click(okButton);
  expect(publishDrive).toHaveBeenCalledWith(1);
});

test("Approve and publish (the REQUEST shortcut) goes through the same checklist gate instead of firing immediately", async () => {
  mockSections([]);
  getDrive.mockResolvedValue({ data: { status: "success", data: {
    id: 1, companyName: "Acme", jobTitle: "SDE", lifecycleStatus: "REQUEST", driveMode: "ON_CAMPUS", roleOptionsJson: [{ name: "Default" }], eligibilityJson: {},
  } } });
  render(<TpoDrivePage />);
  fireEvent.click((await screen.findAllByText("Approve and publish"))[0]);
  expect(await screen.findByText("Fix these before publishing")).toBeInTheDocument();
  expect(approveAndPublishDrive).not.toHaveBeenCalled();
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByRole("button", { name: "Approve and publish" })).toBeDisabled();
});
