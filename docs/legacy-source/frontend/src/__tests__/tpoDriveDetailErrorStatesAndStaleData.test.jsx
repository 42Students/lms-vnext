/**
 * UI/UX audit (Batch 3 #12/#13, Batch 4 #1): Drive Detail used to (a) show a toast then collapse
 * into a blank-ish page on a genuine Job load failure, (b) silently treat Applicants/Rounds/
 * Offers/Summary/Activity failures as empty datasets whenever the Job request itself succeeded
 * (a backend failure looked exactly like "0 applicants"), and (c) keep the previous drive's data
 * on screen for a moment when navigating directly from one jobId to another.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import TpoDrivePage from "@/pages/tpo/drives/[jobId]";
import {
  getDrive, getNotApplied,
} from "@/api/Services/TpoService";
import {
  getDriveActivity, getWorkspaceApplicants, getWorkspaceOffers, getWorkspaceRounds, getWorkspaceSummary,
} from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/components/tpo/drive/ApplicantsTab", () => function ApplicantsTabStub() { return <div>ApplicantsTabStub</div>; });
jest.mock("@/components/tpo/drive/RoundsTab", () => function RoundsTabStub() { return <div>RoundsTabStub</div>; });
jest.mock("@/components/tpo/drive/OffersTab", () => function OffersTabStub() { return <div>OffersTabStub</div>; });
jest.mock("@/components/tpo/drive/OverviewTab", () => function OverviewTabStub() { return <div>OverviewTabStub</div>; });
jest.mock("@/api/Services/TpoService", () => ({
  approveDrive: jest.fn(), cancelDrive: jest.fn(), closeDrive: jest.fn(), extendDeadline: jest.fn(), getDrive: jest.fn(),
  getNotApplied: jest.fn(), publishDrive: jest.fn(), rejectDrive: jest.fn(), sendBackDrive: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  approveAndPublishDrive: jest.fn(), getDriveActivity: jest.fn(), getEligibilityPreview: jest.fn(),
  getWorkspaceApplicants: jest.fn(), getWorkspaceOffers: jest.fn(), getWorkspaceRounds: jest.fn(), getWorkspaceSummary: jest.fn(),
}));

const jobA = { id: 1, companyName: "Acme", jobTitle: "SDE", lifecycleStatus: "PUBLISHED", driveMode: "ON_CAMPUS" };
const jobB = { id: 2, companyName: "Globex", jobTitle: "Analyst", lifecycleStatus: "PUBLISHED", driveMode: "ON_CAMPUS" };

const mockAllSectionsSuccess = () => {
  getWorkspaceApplicants.mockResolvedValue({ data: { status: "success", data: [] } });
  getNotApplied.mockResolvedValue({ data: { status: "success", data: [] } });
  getWorkspaceRounds.mockResolvedValue({ data: { status: "success", data: [] } });
  getWorkspaceOffers.mockResolvedValue({ data: { status: "success", data: [] } });
  getWorkspaceSummary.mockResolvedValue({ data: { status: "success", data: {} } });
  getDriveActivity.mockResolvedValue({ data: { status: "success", data: [] } });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAllSectionsSuccess();
});

test("a failed Job load shows an inline error with Retry, not a blank page", async () => {
  useRouter.mockReturnValue({ query: { jobId: "1" }, push: jest.fn(), pathname: "/tpo/drives/1", replace: jest.fn() });
  getDrive.mockRejectedValue({ response: { data: { message: "Drive not found" } } });
  render(<TpoDrivePage />);
  expect(await screen.findByText("Drive not found")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
});

test("a failed Applicants/Rounds load is surfaced, not silently rendered as zero", async () => {
  useRouter.mockReturnValue({ query: { jobId: "1" }, push: jest.fn(), pathname: "/tpo/drives/1", replace: jest.fn() });
  getDrive.mockResolvedValue({ data: { status: "success", data: jobA } });
  getWorkspaceApplicants.mockRejectedValue({ response: { data: { message: "boom" } } });
  getWorkspaceRounds.mockRejectedValue({ response: { data: { message: "boom" } } });
  render(<TpoDrivePage />);
  expect(await screen.findByText(/Could not load: Applicants, Rounds/)).toBeInTheDocument();
});

test("no section-error banner when everything loads fine", async () => {
  useRouter.mockReturnValue({ query: { jobId: "1" }, push: jest.fn(), pathname: "/tpo/drives/1", replace: jest.fn() });
  getDrive.mockResolvedValue({ data: { status: "success", data: jobA } });
  render(<TpoDrivePage />);
  await screen.findByText("Acme · SDE");
  expect(screen.queryByText(/Could not load:/)).not.toBeInTheDocument();
});

test("navigating directly from one drive to another clears the old drive's data first", async () => {
  useRouter.mockReturnValue({ query: { jobId: "1" }, push: jest.fn(), pathname: "/tpo/drives/1", replace: jest.fn() });
  getDrive.mockResolvedValue({ data: { status: "success", data: jobA } });
  const { rerender } = render(<TpoDrivePage />);
  await screen.findByText("Acme · SDE");

  let resolveB;
  getDrive.mockReturnValue(new Promise((res) => { resolveB = res; }));
  useRouter.mockReturnValue({ query: { jobId: "2" }, push: jest.fn(), pathname: "/tpo/drives/2", replace: jest.fn() });
  rerender(<TpoDrivePage />);

  expect(screen.queryByText("Acme · SDE")).not.toBeInTheDocument();

  resolveB({ data: { status: "success", data: jobB } });
  await screen.findByText("Globex · Analyst");
});

test("drive mission control exposes reach, conversion and actionable gaps from loaded workspace data", async () => {
  useRouter.mockReturnValue({ query: { jobId: "1" }, push: jest.fn(), pathname: "/tpo/drives/[jobId]", replace: jest.fn() });
  getDrive.mockResolvedValue({ data: { status: "success", data: jobA } });
  getWorkspaceApplicants.mockResolvedValue({ data: { status: "success", data: [
    { applicationId: 1, learnerId: 10, stage: "APPLIED" },
    { applicationId: 2, learnerId: 11, stage: "INTERVIEW" },
  ] } });
  getNotApplied.mockResolvedValue({ data: { status: "success", data: [{ id: 12 }, { id: 13 }] } });
  getWorkspaceRounds.mockResolvedValue({ data: { status: "success", data: [{ id: 1, status: "COMPLETED", stagedResults: 2 }] } });
  getWorkspaceOffers.mockResolvedValue({ data: { status: "success", data: [{ id: 1, status: "PENDING_VERIFICATION" }] } });
  getWorkspaceSummary.mockResolvedValue({ data: { status: "success", data: { funnel: [
    { stage: "APPLIED", count: 2 },
    { stage: "INTERVIEW", count: 1 },
    { stage: "OFFERED", count: 1 },
  ] } } });

  render(<TpoDrivePage />);

  // The attention list and the number strip replaced the old "mission control" hero; wait on a
  // data-dependent value (the conversion % is computed from the loaded applicants).
  // The Next step card carries what needs doing (the old reach line and "mission control" are gone).
  expect(await screen.findByLabelText("Next step")).toBeInTheDocument();
  expect(screen.queryByText("Drive mission control")).not.toBeInTheDocument();
  expect(screen.getByText("2 eligible registered students have not applied")).toBeInTheDocument();
  expect(screen.getByText("2 round results are waiting to be applied")).toBeInTheDocument();
  expect(screen.getByText("1 selection needs verification")).toBeInTheDocument();
});
