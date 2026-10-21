import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RecruiterDrivePage from "@/pages/recruiter/drives/[jobId]";
import {
  addDriveRound, deleteDriveRound, getDriveApplicants, getDrivePipeline, getRecruiterMe, listDriveNotes, listDriveOffers, listDriveRounds, listHrThreads, listMyDrives,
} from "@/api/Services/RecruiterService";

let mockQuery = { jobId: "42", tab: "rounds" };
jest.mock("next/router", () => ({ useRouter: () => ({ query: mockQuery, pathname: "/recruiter/drives/[jobId]", push: jest.fn(), replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/RecruiterService", () => ({
  getRecruiterMe: jest.fn(), listMyDrives: jest.fn(), listDriveRounds: jest.fn(), getDriveApplicants: jest.fn(), listDriveOffers: jest.fn(), listDriveNotes: jest.fn(), saveDriveNote: jest.fn(),
  getDrivePipeline: jest.fn(), listHrThreads: jest.fn(), getHrThread: jest.fn(), sendRecruiterMessage: jest.fn(), listRoundSlots: jest.fn(), proposeRoundSlots: jest.fn(), submitRoundResults: jest.fn(),
  submitSelectionList: jest.fn(), downloadDriveResumesZip: jest.fn(), addDriveRound: jest.fn(), updateDriveRound: jest.fn(), deleteDriveRound: jest.fn(),
}));
jest.mock("@/components/tpo/drive/DrivePipeline", () => function DrivePipelineStub() { return <div />; });

const DRIVE = { id: 42, roleTitle: "SDE", applicants: 0, offers: 0, lifecycle: "PUBLISHED" };
const cellRound = { id: 1, seq: 1, kind: "TEST", name: "Aptitude", status: "PENDING", resultsWaiting: 0, resultsApplied: 0, slotsConfirmed: 0, slotsProposed: 0, mine: 0, addedByRecruiter: 0, inUse: 0 };
const myRound = { id: 2, seq: 2, kind: "INTERVIEW", name: "Managerial", status: "PENDING", resultsWaiting: 0, resultsApplied: 0, slotsConfirmed: 0, slotsProposed: 0, mine: 1, addedByRecruiter: 1, inUse: 0 };

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = { jobId: "42", tab: "rounds" };
  listDriveOffers.mockResolvedValue({ data: [] });
  listDriveNotes.mockResolvedValue({ data: [] });
  getDrivePipeline.mockResolvedValue({ data: [] });
  getRecruiterMe.mockResolvedValue({ data: { scope: "COLLEGE", collegeId: 7 } });
  listHrThreads.mockResolvedValue({ data: [] });
  listMyDrives.mockResolvedValue({ data: [DRIVE] });
  getDriveApplicants.mockResolvedValue({ data: { shared: false, applicants: [], columns: [] } });
});

// Full page with antd pickers; under a loaded full-suite run the default 5s is flaky.
jest.setTimeout(30000);

test("a recruiter can add a round, and only their own round offers Change and Remove", async () => {
  listDriveRounds.mockResolvedValue({ data: [cellRound, myRound] });
  addDriveRound.mockResolvedValue({ data: { id: 3 } });
  render(<RecruiterDrivePage />);
  expect(await screen.findByText(/Managerial/)).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1);
  expect(screen.getAllByRole("button", { name: "Change" })).toHaveLength(1);
  expect(screen.getByText("Added by you")).toBeInTheDocument();

  fireEvent.click(screen.getByTestId("recruiter.rounds.add"));
  fireEvent.change(await screen.findByPlaceholderText(/Managerial round/), { target: { value: "Founder chat" } });
  fireEvent.click(screen.getByRole("button", { name: "Add round" }));
  await waitFor(() => expect(addDriveRound).toHaveBeenCalledWith(7, "42", { kind: "INTERVIEW", name: "Founder chat", mode: null }));
});

test("removing a round of their own asks first, then calls the server", async () => {
  listDriveRounds.mockResolvedValue({ data: [cellRound, myRound] });
  deleteDriveRound.mockResolvedValue({ data: { deleted: true } });
  render(<RecruiterDrivePage />);
  await screen.findByText(/Managerial/);
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(screen.getAllByRole("button", { name: "Remove" }).length).toBeGreaterThan(1));
  fireEvent.click(screen.getAllByRole("button", { name: "Remove" }).pop());
  await waitFor(() => expect(deleteDriveRound).toHaveBeenCalledWith(7, "42", 2));
});

test("a finished drive offers no way to add a round", async () => {
  listMyDrives.mockResolvedValue({ data: [{ ...DRIVE, lifecycle: "CLOSED" }] });
  listDriveRounds.mockResolvedValue({ data: [cellRound] });
  render(<RecruiterDrivePage />);
  await screen.findByText(/Aptitude/);
  expect(screen.queryByTestId("recruiter.rounds.add")).not.toBeInTheDocument();
});

test("ticking several applicants sets one outcome for all of them", async () => {
  listDriveRounds.mockResolvedValue({ data: [cellRound] });
  getDriveApplicants.mockResolvedValue({ data: { shared: true, applicants: [{ applicantId: "a1", firstName: "Asha" }, { applicantId: "a2", firstName: "Ravi" }, { applicantId: "a3", firstName: "Meena" }], columns: ["applicantId"] } });
  render(<RecruiterDrivePage />);
  await screen.findByText(/Aptitude/);
  fireEvent.click(await screen.findByText(/Send a round.s results/));
  const bulk = await screen.findByTestId("recruiter.results.bulk");
  expect(bulk).toHaveTextContent("Tick rows");
  const boxes = screen.getAllByRole("checkbox");
  fireEvent.click(boxes[1]); fireEvent.click(boxes[2]); // two applicants (index 0 is select-all)
  expect(await screen.findByText("2 selected:")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Pass / shortlisted" }));
  expect(await screen.findByRole("button", { name: /Send 2 result/ })).toBeInTheDocument();
});
