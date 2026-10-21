/** Drive form audit: missing items are marked on their fields before publishing, not only in a toast. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import DriveFormPage from "@/components/tpo/DriveFormPage";
import { getDrive, getDriveRounds, listDrives, updateDrive } from "@/api/Services/TpoService";
import { getCompanies, getCompanyHistory, getWorkspaceApplicants } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ __esModule: true, default: { events: { on: jest.fn(), off: jest.fn() }, asPath: "/" }, useRouter: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  createDrive: jest.fn(), getDrive: jest.fn(), getDriveRounds: jest.fn(), listDrives: jest.fn(), publishDrive: jest.fn(), updateDrive: jest.fn(), inviteRecruiterToReview: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  getCgpaRule: jest.fn(() => Promise.resolve({ data: { status: "success", data: { rule: "X9_5", options: [] } } })), cloneDrive: jest.fn(), getCompanies: jest.fn(), getCompanyHistory: jest.fn(), searchCompanies: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), resolveCompany: jest.fn(), getEligibilityPreview: jest.fn(), getWorkspaceApplicants: jest.fn(), getStudentsTable: jest.fn().mockResolvedValue({ data: { status: "success", data: { students: [{ branch: "CSE", batch: "2027" }] } } }),
}));

// These render full pages with antd Selects/Modals; under a loaded CI/dev machine the default 5s is flaky, and so is the 1s
// default of waitFor/findBy (the dev image build runs the suite in band and failed here on 13 Oct 2026).
jest.setTimeout(60000);
const SLOW = { timeout: 15000 };

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace: jest.fn(), pathname: "/tpo/drives/new" });
  listDrives.mockResolvedValue({ data: { status: "success", data: [] } });
  getCompanies.mockResolvedValue({ data: { status: "success", data: [{ name: "Acme" }] } });
});


test("Review and publish marks the missing deadline on the field and does not leave the page", async () => {
  const push = jest.fn();
  useRouter.mockReturnValue({ query: {}, push, replace: jest.fn(), pathname: "/tpo/drives/[jobId]/edit" });
  getDrive.mockResolvedValue({ data: { status: "success", data: { id: 5, companyName: "Zoho", jobTitle: "CRM Executive", lifecycleStatus: "DRAFT", driveMode: "ON_CAMPUS" } } });
  getDriveRounds.mockResolvedValue({ data: { status: "success", data: [] } });
  render(<DriveFormPage editId={5} />);
  await waitFor(() => expect(document.querySelector('input[id="companyName"]')).toHaveValue("Zoho"), SLOW);
  Element.prototype.scrollIntoView = jest.fn();
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  expect(await screen.findByText("Students need to know when applications close", {}, SLOW)).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
  expect(updateDrive).not.toHaveBeenCalled();
});


test("a failed applicant-impact lookup never opens a live-save confirmation claiming zero applicants", async () => {
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace: jest.fn(), pathname: "/tpo/drives/[jobId]/edit" });
  getDrive.mockResolvedValue({
    data: {
      status: "success",
      data: {
        id: 5,
        companyName: "Zoho",
        jobTitle: "CRM Executive",
        lifecycleStatus: "PUBLISHED",
        driveMode: "ON_CAMPUS",
        roleOptionsJson: [{ name: "Default", bondNone: true }],
      },
    },
  });
  getDriveRounds.mockResolvedValue({ data: { status: "success", data: [] } });
  getWorkspaceApplicants.mockRejectedValueOnce(new Error("applicant lookup failed"));

  render(<DriveFormPage editId={5} />);
  const companyInput = await waitFor(() => {
    const node = document.querySelector('input[id="companyName"]');
    expect(node).toHaveValue("Zoho");
    return node;
  }, SLOW);

  fireEvent.change(companyInput, { target: { value: "Zoho Ltd" } });
  const saveButton = await screen.findByRole("button", { name: "Save changes" }, SLOW);
  await waitFor(() => expect(saveButton).toBeEnabled(), SLOW);
  fireEvent.click(saveButton);

  await waitFor(() => expect(getWorkspaceApplicants).toHaveBeenCalledWith(5), SLOW);
  expect(screen.queryByText("Save changes to a live drive?")).not.toBeInTheDocument();
  expect(screen.queryByText(/0 people have applied/)).not.toBeInTheDocument();
});

test("the top bar says who last saved and when, with Invite the recruiter to review beside Publish", async () => {
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace: jest.fn(), pathname: "/tpo/drives/[jobId]/edit" });
  getDrive.mockResolvedValue({ data: { status: "success", data: { id: 5, companyName: "Zoho", jobTitle: "CRM Executive", lifecycleStatus: "DRAFT", driveMode: "ON_CAMPUS",
    lastSavedByName: "Asha Rao", lastSavedAt: "2026-10-11T14:05:00" } } });
  getDriveRounds.mockResolvedValue({ data: { status: "success", data: [] } });
  render(<DriveFormPage editId={5} />);
  expect(await screen.findByText("Last saved by Asha Rao at 14:05 11 Oct 2026", {}, SLOW)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Invite the recruiter to review" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
});
