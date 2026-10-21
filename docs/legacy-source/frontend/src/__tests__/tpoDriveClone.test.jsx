/**
 * Clone a past drive: it asks before making the draft and says what comes across; the list says each drive's status and month,
 * newest first, without a recruiter's request; the copy says where it came from and what it left behind.
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useRouter } from "next/router";
import DriveFormPage, { clonableDrives, cloneOptionMeta } from "@/components/tpo/DriveFormPage";
import { getDrive, getDriveRounds, listDrives } from "@/api/Services/TpoService";
import { cloneDrive, getCompanies } from "@/api/Services/TpoHubService";
import { getBatches } from "@/api/Services/BatchesService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  createDrive: jest.fn(), getDrive: jest.fn(), getDriveRounds: jest.fn(), listDrives: jest.fn(), publishDrive: jest.fn(), updateDrive: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  getCgpaRule: jest.fn(() => Promise.resolve({ data: { status: "success", data: { rule: "X9_5", options: [] } } })), cloneDrive: jest.fn(), getCompanies: jest.fn(), getCompanyHistory: jest.fn(), searchCompanies: jest.fn(() => Promise.resolve({ data: { status: "success", data: [] } })), resolveCompany: jest.fn(), getEligibilityPreview: jest.fn(() => Promise.resolve({ data: {} })), getWorkspaceApplicants: jest.fn(),
  getStudentsTable: jest.fn().mockResolvedValue({ data: { students: [] } }),
}));
jest.mock("@/api/Services/BatchesService", () => ({ getBatches: jest.fn() }));
jest.setTimeout(30000);

const drives = [
  { id: 1, companyName: "Infosys", jobTitle: "System Engineer", lifecycleStatus: "CLOSED", postedDate: "2025-08-01T10:00:00", applicationDeadline: "2025-08-10T10:00:00" },
  { id: 2, companyName: "Infosys", jobTitle: "System Engineer", lifecycleStatus: "PUBLISHED", postedDate: "2026-09-01T10:00:00", applicationDeadline: "2026-09-20T10:00:00" },
  { id: 3, companyName: "Acme", jobTitle: "Analyst", lifecycleStatus: "REQUEST", postedDate: "2026-09-05T10:00:00" },
];
let replace;

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  replace = jest.fn();
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace, pathname: "/tpo/drives/new" });
  listDrives.mockResolvedValue({ data: drives });
  getCompanies.mockResolvedValue({ data: [] });
  getBatches.mockResolvedValue({ data: { batches: [] } });
  getDriveRounds.mockResolvedValue({ data: [] });
});

test("the list is newest first, says each drive's status and month, and leaves out a recruiter's request", () => {
  const list = clonableDrives(drives);
  expect(list.map((d) => d.id)).toEqual([2, 1]);
  expect(cloneOptionMeta(list[0])).toBe("Live · Sep 2026");
  expect(cloneOptionMeta(list[1])).toBe("Completed · Aug 2025");
});

test("picking a drive asks first and says what comes across; Cancel makes nothing", async () => {
  cloneDrive.mockResolvedValue({ data: { status: "success", data: { id: 77, sourceName: "Infosys · System Engineer", droppedBatches: 1, droppedPassingYears: [2025] } } });
  render(<DriveFormPage />);
  await waitFor(() => expect(listDrives).toHaveBeenCalled());
  const select = screen.getByTestId("drive.clone-select").querySelector(".ant-select-selector");
  fireEvent.mouseDown(select);
  fireEvent.click(await screen.findByText("Completed · Aug 2025"));
  const confirm = await screen.findByTestId("drive.clone-confirm");
  expect(confirm).toHaveTextContent("Not copied: the deadline, round dates and links, applicants, results and offers.");
  expect(cloneDrive).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(cloneDrive).not.toHaveBeenCalled();
});

test("Make a copy makes the draft, keeps what it left behind for the copy's page, and opens it", async () => {
  cloneDrive.mockResolvedValue({ data: { status: "success", data: { id: 77, sourceName: "Infosys · System Engineer", droppedBatches: 1, droppedPassingYears: [2025] } } });
  render(<DriveFormPage />);
  await waitFor(() => expect(listDrives).toHaveBeenCalled());
  fireEvent.mouseDown(screen.getByTestId("drive.clone-select").querySelector(".ant-select-selector"));
  fireEvent.click(await screen.findByText("Completed · Aug 2025"));
  // Modal.confirm renders outside the tree under test: take the newest one.
  const buttons = await screen.findAllByText("Make a copy");
  await act(async () => { fireEvent.click(buttons[buttons.length - 1].closest("button")); });
  expect(cloneDrive).toHaveBeenCalledWith(1);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/tpo/drives/77/edit"));
  expect(JSON.parse(window.sessionStorage.getItem("tpo-drive-cloned:77"))).toMatchObject({ sourceName: "Infosys · System Engineer", droppedBatches: 1, droppedPassingYears: [2025] });
});

test("the copy says where it came from and what it left behind", async () => {
  window.sessionStorage.setItem("tpo-drive-cloned:77", JSON.stringify({ sourceName: "Infosys · System Engineer", droppedBatches: 2, droppedPassingYears: [2024, 2025], wasRecordedOutside: true, wasFromRecruiter: true }));
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace, pathname: "/tpo/drives/[jobId]/edit" });
  getDrive.mockResolvedValue({ data: { id: 77, companyName: "Infosys", jobTitle: "System Engineer", lifecycleStatus: "DRAFT", driveMode: "ON_CAMPUS" } });
  render(<DriveFormPage editId={77} />);
  const note = await screen.findByTestId("drive.clone-note");
  expect(within(note).getByText("Copied from Infosys · System Engineer")).toBeInTheDocument();
  expect(note).toHaveTextContent("2 batches have finished placements and were taken out of eligibility.");
  expect(note).toHaveTextContent("Past passing years 2024, 2025 were taken out of eligibility.");
  expect(note).toHaveTextContent("This copy is a normal drive students apply to.");
  expect(note).toHaveTextContent("the recruiter is not linked to it.");
});

test("a closed drive's edit page is read only: no autosave, no publish, and it says to copy it instead", async () => {
  const { updateDrive } = jest.requireMock("@/api/Services/TpoService");
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace, pathname: "/tpo/drives/[jobId]/edit" });
  getDrive.mockResolvedValue({ data: { id: 9, companyName: "Infosys", jobTitle: "System Engineer", lifecycleStatus: "CLOSED", driveMode: "ON_CAMPUS" } });
  render(<DriveFormPage editId={9} />);
  expect(await screen.findByTestId("drive.form-frozen")).toHaveTextContent("This drive is completed: nothing here can be changed.");
  expect(document.querySelector('input[id="companyName"]')).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  expect(updateDrive).not.toHaveBeenCalled();
});

test("BE-0037: an existing drive can't be edited or autosaved before it has loaded, and a failed load stays locked with Retry", async () => {
  const { updateDrive } = jest.requireMock("@/api/Services/TpoService");
  useRouter.mockReturnValue({ query: {}, push: jest.fn(), replace, pathname: "/tpo/drives/[jobId]/edit" });
  let fail;
  getDrive.mockReturnValue(new Promise((_, reject) => { fail = reject; }));
  const { unmount } = render(<DriveFormPage editId={12} />);
  expect(await screen.findByTestId("drive.form-loading")).toBeInTheDocument();
  expect(document.querySelector('input[id="companyName"]')).toBeDisabled();
  expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  await act(async () => { fail({ response: { status: 500, data: { message: "Drive not found" } } }); });
  expect(await screen.findByTestId("drive.form-load-error")).toBeInTheDocument();
  expect(document.querySelector('input[id="companyName"]')).toBeDisabled();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  await act(async () => { await new Promise((r) => setTimeout(r, 1500)); });
  expect(updateDrive).not.toHaveBeenCalled();
  unmount();
});
