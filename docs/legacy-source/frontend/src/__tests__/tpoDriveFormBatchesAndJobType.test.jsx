/** Drive form: a drive targets batches (not a season) and says what it offers; an internship is flagged as never counting as placed. */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import DriveFormPage from "@/components/tpo/DriveFormPage";
import { getDrive, getDriveRounds, listDrives } from "@/api/Services/TpoService";
import { getCompanies } from "@/api/Services/TpoHubService";
import { getBatches } from "@/api/Services/BatchesService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  createDrive: jest.fn(), getDrive: jest.fn(), getDriveRounds: jest.fn(), listDrives: jest.fn(), publishDrive: jest.fn(), updateDrive: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  getCgpaRule: jest.fn(() => Promise.resolve({ data: { status: "success", data: { rule: "X9_5", options: [] } } })), cloneDrive: jest.fn(), getCompanies: jest.fn(), getCompanyHistory: jest.fn(), searchCompanies: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), resolveCompany: jest.fn(), getEligibilityPreview: jest.fn(), getWorkspaceApplicants: jest.fn(),
  getStudentsTable: jest.fn().mockResolvedValue({ data: { students: [] } }),
}));
jest.mock("@/api/Services/BatchesService", () => ({ getBatches: jest.fn() }));
jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace: jest.fn(), pathname: "/tpo/drives/[jobId]/edit" });
  listDrives.mockResolvedValue({ data: [] });
  getCompanies.mockResolvedValue({ data: [] });
  getBatches.mockResolvedValue({ data: { batches: [
    { batchId: 21, name: "CSE 2023-27", eligible: 120, state: "IN_PLACEMENTS" },
    { batchId: 9, name: "CSE 2021-25", eligible: 70, state: "FINISHED" },
  ] } });
  getDriveRounds.mockResolvedValue({ data: [] });
});

test("an internship drive keeps its type and its batches, and says it never counts as placed", async () => {
  getDrive.mockResolvedValue({ data: { id: 5, companyName: "Zoho", jobTitle: "Intern", lifecycleStatus: "DRAFT", driveMode: "ON_CAMPUS", jobType: "Internship",
    eligibilityJson: { batchIds: [21] } } });
  render(<DriveFormPage editId={5} />);
  await waitFor(() => expect(document.querySelector('input[id="companyName"]')).toHaveValue("Zoho"));
  expect(await screen.findByText("Offers from Internship drives do not count as placed.")).toBeInTheDocument();
  expect(await screen.findByText("CSE 2023-27 · 120 eligible")).toBeInTheDocument();
  expect(screen.queryByText(/CSE 2021-25/)).not.toBeInTheDocument(); // finished batches are not offered
});
