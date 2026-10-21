/** A drive that happened outside the platform: the form asks for no deadline or link, and Review and publish goes on. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import DriveFormPage from "@/components/tpo/DriveFormPage";
import { getDrive, getDriveRounds, listDrives, updateDrive } from "@/api/Services/TpoService";
import { getCompanies } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  createDrive: jest.fn(), getDrive: jest.fn(), getDriveRounds: jest.fn(), listDrives: jest.fn(), publishDrive: jest.fn(), updateDrive: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  getCgpaRule: jest.fn(() => Promise.resolve({ data: { status: "success", data: { rule: "X9_5", options: [] } } })), cloneDrive: jest.fn(), getCompanies: jest.fn(), getCompanyHistory: jest.fn(), searchCompanies: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), resolveCompany: jest.fn(), getEligibilityPreview: jest.fn(() => Promise.resolve({ data: {} })), getWorkspaceApplicants: jest.fn(),
  getStudentsTable: jest.fn().mockResolvedValue({ data: { status: "success", data: { students: [] } } }),
}));
jest.setTimeout(30000);

test("recorded outside: no deadline or link needed, it saves the flag and goes to the publish check", async () => {
  const push = jest.fn();
  useRouter.mockReturnValue({ query: {}, push, replace: jest.fn(), pathname: "/tpo/drives/[jobId]/edit" });
  listDrives.mockResolvedValue({ data: [] });
  getCompanies.mockResolvedValue({ data: [] });
  getDrive.mockResolvedValue({ data: {
    id: 8,
    companyName: "Outside Co",
    jobTitle: "Field Engineer",
    lifecycleStatus: "DRAFT",
    driveMode: "OFF_CAMPUS",
    recordedOutside: true,
    jobType: "Full-time",
    roleOptionsJson: [{ name: "Default", ctcLpa: 6 }], // pay is required to publish, recorded or not
    applicationDeadline: "2026-10-20T18:00:00",
    requiresExternalRegistration: true,
    externalPortalName: "Legacy portal",
    externalPortalUrl: "https://legacy.example.test/apply",
  } });
  getDriveRounds.mockResolvedValue({ data: [] });
  updateDrive.mockResolvedValue({ data: { id: 8 } });
  render(<DriveFormPage editId={8} />);
  await waitFor(() => expect(screen.getByRole("checkbox", { name: /already happened outside/ })).toBeChecked(), { timeout: 5000 }); // the form loads the drive first
  expect(screen.getByText("Not needed for a recorded drive")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/tpo/drives/8?publish=1"));
  const saved = updateDrive.mock.calls[0][1];
  expect(saved.recordedOutside).toBe(true);
  expect(saved.applicationDeadline).toBeNull();
  expect(saved.requiresExternalRegistration).toBe(false);
  expect(saved.externalPortalName).toBeNull();
  expect(saved.externalPortalUrl).toBeNull();
});
