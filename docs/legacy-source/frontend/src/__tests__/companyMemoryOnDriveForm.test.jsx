/**
 * UI/UX audit, buy-signal extra "Company Memory" (2026-10-01): picking an existing company from
 * "Start from" used to just fill in the Company field - the TPO had to go dig through old drives
 * to remember what that company paid last time or how many they hired. This surfaces it inline.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import DriveFormPage from "@/components/tpo/DriveFormPage";
import { listDrives } from "@/api/Services/TpoService";
import { getCompanies, getCompanyHistory } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  createDrive: jest.fn(), getDrive: jest.fn(), getDriveRounds: jest.fn(), listDrives: jest.fn(), publishDrive: jest.fn(), updateDrive: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  getCgpaRule: jest.fn(() => Promise.resolve({ data: { status: "success", data: { rule: "X9_5", options: [] } } })), cloneDrive: jest.fn(), getCompanies: jest.fn(), getCompanyHistory: jest.fn(), searchCompanies: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), resolveCompany: jest.fn(), getEligibilityPreview: jest.fn(), getWorkspaceApplicants: jest.fn(), getStudentsTable: jest.fn().mockResolvedValue({ data: { status: "success", data: { students: [{ branch: "CSE", batch: "2027" }] } } }),
}));

// These render full pages with antd Selects/Modals; under a loaded CI/dev machine the default 5s is flaky.
jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace: jest.fn(), pathname: "/tpo/drives/new" });
  listDrives.mockResolvedValue({ data: { status: "success", data: [] } });
  getCompanies.mockResolvedValue({ data: { status: "success", data: [{ name: "Acme" }] } });
});

test("picking an existing company surfaces its past drive history", async () => {
  getCompanyHistory.mockResolvedValue({ data: { status: "success", data: {
    driveCount: 2, hired: 3, lastDriveAt: "2025-08-01T00:00:00", recentRoles: [{ jobTitle: "SDE", ctcRange: "8-10 LPA", createdAt: "2025-08-01T00:00:00" }],
  } } });
  render(<DriveFormPage />);

  const [companySelect] = await screen.findAllByRole("combobox");
  fireEvent.mouseDown(companySelect);
  fireEvent.click(await screen.findByTitle("Acme"));

  expect(await screen.findByText(/2 past drives here/)).toBeInTheDocument();
  expect(screen.getByText(/3 hired/)).toBeInTheDocument();
  expect(screen.getByText(/last drive Aug 2025/)).toBeInTheDocument();
  expect(screen.getByText(/SDE · 8-10 LPA · 2025/)).toBeInTheDocument();
  expect(getCompanyHistory).toHaveBeenCalledWith("Acme");
});

test("a company with no drives here shows nothing extra", async () => {
  getCompanyHistory.mockResolvedValue({ data: { status: "success", data: { driveCount: 0, hired: 0, lastDriveAt: null, recentRoles: [] } } });
  render(<DriveFormPage />);

  const [companySelect] = await screen.findAllByRole("combobox");
  fireEvent.mouseDown(companySelect);
  fireEvent.click(await screen.findByTitle("Acme"));

  await screen.findByDisplayValue("Acme");
  expect(screen.queryByText(/past drives? here/)).not.toBeInTheDocument();
});
