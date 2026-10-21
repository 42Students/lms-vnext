import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddToDriveModal from "@/components/tpo/AddToDriveModal";
import { addStudentsToDrive, listDrives } from "@/api/Services/TpoService";

jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn(async (p) => { try { return { success: true, data: (await p).data }; } catch (e) { return { success: false, data: e?.response?.data }; } }) }));
jest.mock("@/api/Services/TpoService", () => ({ listDrives: jest.fn(), addStudentsToDrive: jest.fn() }));

const selected = [
  { learnerId: 1, firstName: "Asha", lastName: "Rao", journey: [{ jobId: 7 }] },
  { learnerId: 2, firstName: "Bala", lastName: "K", journey: [] },
];

beforeEach(() => {
  jest.clearAllMocks();
  listDrives.mockResolvedValue({ data: [{ id: 7, companyName: "Acme", jobTitle: "SDE", lifecycleStatus: "PUBLISHED" }, { id: 8, companyName: "Old", jobTitle: "QA", lifecycleStatus: "CLOSED" }] });
});

async function pickDrive() {
  const box = await screen.findByRole("combobox");
  fireEvent.mouseDown(box);
  fireEvent.click(await screen.findByText("Acme · SDE"));
}

test("only open drives are offered, and who is already on the drive is said before sending", async () => {
  render(<AddToDriveModal open selected={selected} onClose={jest.fn()} />);
  const box = await screen.findByRole("combobox");
  fireEvent.mouseDown(box);
  expect(await screen.findByText("Acme · SDE")).toBeInTheDocument();
  expect(screen.queryByText("Old · QA")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Acme · SDE"));
  expect(await screen.findByText(/1 of them already applied to this drive/)).toBeInTheDocument();
});

test("a result lists who was added and why anyone was not", async () => {
  addStudentsToDrive.mockResolvedValue({ data: { added: 1, skipped: 1, results: [{ learnerId: 1, outcome: "ALREADY_ON_DRIVE", message: "Already on this drive" }, { learnerId: 2, outcome: "ADDED", message: "Added" }] } });
  const onDone = jest.fn();
  render(<AddToDriveModal open selected={selected} onClose={jest.fn()} onDone={onDone} />);
  await pickDrive();
  fireEvent.click(screen.getByRole("button", { name: /Add .* to drive/ }));
  expect(await screen.findByText("1 added, 1 skipped")).toBeInTheDocument();
  expect(screen.getByText("Asha Rao")).toBeInTheDocument();
  expect(screen.getByText("Already on this drive")).toBeInTheDocument();
  expect(addStudentsToDrive).toHaveBeenCalledWith(7, { learnerIds: [1, 2], includeIneligible: false, reason: null });
  expect(onDone).toHaveBeenCalled();
});

test("adding ineligible students needs a reason first", async () => {
  render(<AddToDriveModal open selected={selected} onClose={jest.fn()} />);
  await pickDrive();
  fireEvent.click(screen.getByLabelText(/Add students who are not eligible anyway/));
  const add = screen.getByRole("button", { name: /Add .* to drive/ });
  expect(add).toBeDisabled();
  fireEvent.change(screen.getByPlaceholderText(/Why/), { target: { value: "Company agreed" } });
  await waitFor(() => expect(add).not.toBeDisabled());
});
