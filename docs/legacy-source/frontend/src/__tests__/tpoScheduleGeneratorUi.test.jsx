/**
 * TPO UX batch 2: the schedule window offers "Generate the day", lets an unbooked slot be removed (booked ones cannot),
 * and the students automatic assignment could not place can be put into a slot without leaving the window.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ScheduleModal from "@/components/tpo/drive/ScheduleModal";
import { clearUnbookedSlots, commitAssignment, deleteSlot, getAssignments, getRescheduleRequests, getSlots, previewAssignment } from "@/api/Services/TpoHubService";

jest.mock("@/api/Services/TpoHubService", () => ({
  clearUnbookedSlots: jest.fn(), commitAssignment: jest.fn(), confirmSlot: jest.fn(), decideReschedule: jest.fn(), deleteSlot: jest.fn(),
  getAssignments: jest.fn(), getRescheduleRequests: jest.fn(), getSlots: jest.fn(), previewAssignment: jest.fn(), proposeSlots: jest.fn(),
}));

const ok = (data) => ({ data: { status: "success", data } });
const slots = [
  { id: 1, startsAt: "2026-10-12T09:00:00", endsAt: "2026-10-12T09:20:00", room: "Panel A", capacity: 1, booked: 1, status: "CONFIRMED" },
  { id: 2, startsAt: "2026-10-12T09:20:00", endsAt: "2026-10-12T09:40:00", room: "Panel A", capacity: 1, booked: 0, status: "CONFIRMED" },
];

beforeEach(() => {
  jest.clearAllMocks();
  getSlots.mockResolvedValue(ok(slots));
  getRescheduleRequests.mockResolvedValue(ok([]));
  getAssignments.mockResolvedValue(ok([]));
  deleteSlot.mockResolvedValue(ok({ removed: 1 }));
  clearUnbookedSlots.mockResolvedValue(ok({ removed: 1 }));
  commitAssignment.mockResolvedValue(ok({ saved: 1 }));
});

const renderModal = () => render(<ScheduleModal round={{ id: 5, name: "Interview", kind: "INTERVIEW", mode: "ON_CAMPUS" }} job={{ id: 1 }} onClose={jest.fn()} />);

// Full modal with antd pickers; under a loaded full-suite run the default 5s is flaky.
jest.setTimeout(30000);

test("offers to generate the day, and only unbooked slots can be removed", async () => {
  renderModal();
  expect(await screen.findByText("Generate the day")).toBeInTheDocument();
  const removes = await screen.findAllByRole("button", { name: /Remove slot/ });
  expect(removes).toHaveLength(1); // slot 1 has a student in it
  fireEvent.click(removes[0]);
  fireEvent.click(await screen.findByRole("button", { name: /^Remove$/ }));
  await waitFor(() => expect(deleteSlot).toHaveBeenCalledWith(5, 2));
});

test("a student the automatic assignment could not place can be put into a free slot", async () => {
  previewAssignment.mockResolvedValue(ok({ total: 2, placed: [], couldNotPlace: [{ applicationId: 77, name: "Dev M", roll: "21EC004", reason: "No free slot without a clash" }] }));
  renderModal();
  await screen.findByText("Generate the day");
  fireEvent.click(screen.getByRole("button", { name: /Preview assignment/ }));
  expect(await screen.findByText(/Could not place \(1\)\. Drag a student onto a slot above, or pick a slot\./)).toBeInTheDocument();
  expect(screen.getAllByLabelText("Place Dev M").length).toBeGreaterThan(0);
  expect(screen.getByText("Dev M")).toBeInTheDocument();
});


test("schedule source failures are explicit and block state-dependent writes", async () => {
  getSlots.mockRejectedValueOnce({ response: { data: { message: "Slots service unavailable" } } });
  renderModal();

  expect(await screen.findByText("Schedule data is partially unavailable")).toBeInTheDocument();
  expect(screen.getByText(/Slots could not be verified/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add slot" })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Preview assignment/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Retry missing data/ })).toBeInTheDocument();
});

test("completed rounds keep schedule visible but disable schedule mutations", async () => {
  render(<ScheduleModal round={{ id: 5, name: "Interview", kind: "INTERVIEW", mode: "ON_CAMPUS", status: "COMPLETED" }} job={{ id: 1 }} onClose={jest.fn()} />);
  expect(await screen.findByText("This round is complete or cancelled. Scheduling is read-only.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add slot" })).toBeDisabled();
  const removes = await screen.findAllByRole("button", { name: /Remove slot/ });
  expect(removes[0]).toBeDisabled();
});
