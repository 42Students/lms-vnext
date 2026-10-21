/**
 * UI/UX audit (brutal recruiter pass, 2026-10-01): the Drive Detail page used to render "we could not
 * find this drive" for ANY failure while loading, not just a genuinely missing drive - so a
 * flaky connection looked identical to a 404 with no way to retry. Separately, sending round
 * results or a selection list went out with a single click and no review step, unlike every other
 * high-impact send in the app.
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import RecruiterDrivePage from "@/pages/recruiter/drives/[jobId]";
import {
  getDriveApplicants, getDrivePipeline, getHrThread, getRecruiterMe, listDriveNotes, listDriveOffers, listDriveRounds, listHrThreads, listMyDrives,
  listRoundSlots, sendRecruiterMessage, submitRoundResults, submitSelectionList,
} from "@/api/Services/RecruiterService";

let mockQuery = { jobId: "42" };
jest.mock("next/router", () => ({ __esModule: true, default: { events: { on: jest.fn(), off: jest.fn() } }, useRouter: () => ({ query: mockQuery, pathname: "/recruiter/drives/[jobId]", push: jest.fn(), replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/RecruiterService", () => ({
  getRecruiterMe: jest.fn(), listMyDrives: jest.fn(), listDriveRounds: jest.fn(), getDriveApplicants: jest.fn(),
  listDriveOffers: jest.fn(), listDriveNotes: jest.fn(), saveDriveNote: jest.fn(), getDrivePipeline: jest.fn(), listHrThreads: jest.fn(), getHrThread: jest.fn(),
  sendRecruiterMessage: jest.fn(), listRoundSlots: jest.fn(), proposeRoundSlots: jest.fn(), addDriveRound: jest.fn(), updateDriveRound: jest.fn(), deleteDriveRound: jest.fn(), submitRoundResults: jest.fn(),
  submitSelectionList: jest.fn(), downloadDriveResumesZip: jest.fn(),
  listRecruiterChangeRequests: jest.fn(() => Promise.resolve({ data: [] })), createRecruiterChangeRequest: jest.fn(), acceptRecruiterChangeRequest: jest.fn(), answerRecruiterChangeRequest: jest.fn(),
}));
jest.mock("@/components/tpo/drive/DrivePipeline", () => function DrivePipelineStub() { return <div />; });

const DRIVE = { id: 42, roleTitle: "SDE", applicants: 2, offers: 0, driveGroupId: null, lifecycle: "PUBLISHED" };
const APPLICANTS = [{ applicantId: "a1", firstName: "Asha" }, { applicantId: "a2", firstName: "Ravi" }];
const ROUNDS = [{ id: 1, seq: 1, name: "Screening", resultsWaiting: 0, resultsApplied: 0 }];

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = { jobId: "42" };
  listDriveOffers.mockResolvedValue({ data: [] });
  listDriveNotes.mockResolvedValue({ data: [] });
  getRecruiterMe.mockResolvedValue({ data: { scope: "COLLEGE", collegeId: 7 } });
  listHrThreads.mockResolvedValue({ data: [] });
});

test("a transient load failure shows a retryable error, not a 404", async () => {
  listMyDrives.mockRejectedValue({ response: { data: { message: "down" } } });
  listDriveRounds.mockResolvedValue({ data: [] });
  getDriveApplicants.mockResolvedValue({ data: { shared: false, applicants: [], columns: [] } });
  render(<RecruiterDrivePage />);
  expect(await screen.findByText("We couldn't load this drive")).toBeInTheDocument();
  expect(screen.queryByText("We could not find this drive")).not.toBeInTheDocument();
});

test("a drive genuinely absent from the list still shows the real not-found page", async () => {
  listMyDrives.mockResolvedValue({ data: [] });
  listDriveRounds.mockResolvedValue({ data: [] });
  getDriveApplicants.mockResolvedValue({ data: { shared: false, applicants: [], columns: [] } });
  render(<RecruiterDrivePage />);
  expect(await screen.findByText("We could not find this drive")).toBeInTheDocument();
});

test("sending round results requires review with a per-outcome breakdown before it goes out", async () => {
  listMyDrives.mockResolvedValue({ data: [DRIVE] });
  listDriveRounds.mockResolvedValue({ data: ROUNDS });
  getDriveApplicants.mockResolvedValue({ data: { shared: true, applicants: APPLICANTS, columns: ["applicantId"] } });
  getDrivePipeline.mockResolvedValue({ data: [] });
  submitRoundResults.mockResolvedValue({ data: { applied: false } });

  mockQuery = { jobId: "42", tab: "rounds" };
  render(<RecruiterDrivePage />);
  fireEvent.click(await screen.findByText(/Send a round.s results/));
  const selects = await screen.findAllByText("No change");
  fireEvent.mouseDown(selects[0]);
  fireEvent.click(await screen.findByTitle("Pass / shortlisted"));

  fireEvent.click(screen.getByText("Send 1 result(s)"));
  expect(submitRoundResults).not.toHaveBeenCalled();
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/1 × Pass/)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));
  await waitFor(() => expect(submitRoundResults).toHaveBeenCalled());
});

test("sending a selection list requires review showing the kind and CTC before it goes out", async () => {
  listMyDrives.mockResolvedValue({ data: [DRIVE] });
  listDriveRounds.mockResolvedValue({ data: ROUNDS });
  getDriveApplicants.mockResolvedValue({ data: { shared: true, applicants: APPLICANTS, columns: ["applicantId"] } });
  getDrivePipeline.mockResolvedValue({ data: [] });
  submitSelectionList.mockResolvedValue({ data: { recorded: 1 } });

  mockQuery = { jobId: "42", tab: "offers" };
  render(<RecruiterDrivePage />);
  fireEvent.click(await screen.findByText(/Send your selection list/));
  const rows = await screen.findAllByRole("checkbox");
  fireEvent.click(rows[1]); // rows[0] is the select-all header checkbox
  fireEvent.change(screen.getByPlaceholderText("CTC (LPA)"), { target: { value: "10" } });

  fireEvent.click(screen.getByText("Send 1 selected"));
  expect(submitSelectionList).not.toHaveBeenCalled();
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/10 LPA/)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));
  expect(submitSelectionList).toHaveBeenCalled();
});


test("round slot load failure is not rendered as a false No slots empty state", async () => {
  listMyDrives.mockResolvedValue({ data: [DRIVE] });
  listDriveRounds.mockResolvedValue({ data: ROUNDS });
  getDriveApplicants.mockResolvedValue({ data: { shared: true, applicants: APPLICANTS, columns: ["applicantId"] } });
  getDrivePipeline.mockResolvedValue({ data: [] });
  listRoundSlots.mockRejectedValue({ response: { data: { message: "slots unavailable" } } });

  mockQuery = { jobId: "42", tab: "rounds" };
  render(<RecruiterDrivePage />);
  fireEvent.click(await screen.findByText("Propose interview times"));
  expect(await screen.findByText("Interview slots could not be loaded")).toBeInTheDocument();
  expect(screen.queryByText("No slots yet")).not.toBeInTheDocument();
});

test("message load failure is retryable instead of masquerading as an empty conversation", async () => {
  listMyDrives.mockResolvedValue({ data: [DRIVE] });
  listDriveRounds.mockResolvedValue({ data: ROUNDS });
  getDriveApplicants.mockResolvedValue({ data: { shared: true, applicants: APPLICANTS, columns: ["applicantId"] } });
  getDrivePipeline.mockResolvedValue({ data: [] });
  listHrThreads.mockRejectedValue({ response: { data: { message: "messages unavailable" } } });

  mockQuery = { jobId: "42", tab: "messages" };
  render(<RecruiterDrivePage />);
  expect(await screen.findByText("Conversation could not be loaded")).toBeInTheDocument();
  expect(screen.queryByText(/No messages yet/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});

test("failed message send preserves the draft and exposes persistent inline recovery", async () => {
  listMyDrives.mockResolvedValue({ data: [DRIVE] });
  listDriveRounds.mockResolvedValue({ data: ROUNDS });
  getDriveApplicants.mockResolvedValue({ data: { shared: true, applicants: APPLICANTS, columns: ["applicantId"] } });
  getDrivePipeline.mockResolvedValue({ data: [] });
  listHrThreads.mockResolvedValue({ data: [] });
  sendRecruiterMessage.mockRejectedValue({ response: { data: { message: "send failed" } } });

  mockQuery = { jobId: "42", tab: "messages" };
  render(<RecruiterDrivePage />);
  const input = await screen.findByPlaceholderText("Write to the placement cell about this drive");
  fireEvent.change(input, { target: { value: "Can we confirm tomorrow?" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));

  expect(await screen.findByText("Message was not sent")).toBeInTheDocument();
  expect(screen.getByText("send failed")).toBeInTheDocument();
  expect(input).toHaveValue("Can we confirm tomorrow?");
});
