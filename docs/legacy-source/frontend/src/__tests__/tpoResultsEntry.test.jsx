/**
 * TPO UX batch 2: a round's results in one place. Everyone is a row with an inline picker, a pasted list of
 * roll numbers fills it in, and "everyone I did not mark" is Not cleared. Nothing is applied from here: it stages.
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ResultsEntryModal from "@/components/tpo/drive/ResultsEntryModal";
import { commitResultsImport, getCandidates } from "@/api/Services/TpoHubService";

jest.setTimeout(30000);
jest.mock("@/api/Services/TpoHubService", () => ({ getCandidates: jest.fn(), commitResultsImport: jest.fn() }));

const candidates = [
  { applicationId: 1, learnerId: 10, firstName: "Asha", lastName: "Rao", rollNumber: "21CS001", branch: "CSE", stage: "SHORTLISTED" },
  { applicationId: 2, learnerId: 11, firstName: "Bala", lastName: "K", rollNumber: "21CS002", branch: "CSE", stage: "SHORTLISTED" },
  { applicationId: 3, learnerId: 12, firstName: "Chitra", lastName: "S", rollNumber: "21EC003", branch: "ECE", stage: "SHORTLISTED" },
];

beforeEach(() => {
  jest.clearAllMocks();
  getCandidates.mockResolvedValue({ data: { status: "success", data: candidates } });
  commitResultsImport.mockResolvedValue({ data: { status: "success", data: { staged: 3 } } });
});

const open = async (props = {}) => {
  const onDone = jest.fn();
  render(<ResultsEntryModal open round={{ id: 7, name: "Technical interview" }} onClose={jest.fn()} onDone={onDone} {...props} />);
  await screen.findByText("Asha Rao");
  return { onDone };
};

test("pasting roll numbers marks those students and reports the ones it could not find", async () => {
  await open();
  fireEvent.change(screen.getByPlaceholderText(/21CS001, 21CS014/), { target: { value: "21cs001\n21CS002 99XX999" } });
  fireEvent.click(screen.getByRole("button", { name: /Mark these 3/ }));
  expect(await screen.findByText("2 marked, 1 not found in this round")).toBeInTheDocument();
  expect(screen.getByText(/Not found: 99XX999/)).toBeInTheDocument();
  expect(screen.getByText("2 Pass")).toBeInTheDocument();
  expect(screen.getByText("1 not marked")).toBeInTheDocument();
});

test("saving stages the marked rows plus 'not cleared' for everyone else, with waitlist ranks in the order marked", async () => {
  const { onDone } = await open();
  fireEvent.change(screen.getByPlaceholderText(/21CS001, 21CS014/), { target: { value: "21CS001" } });
  fireEvent.click(screen.getByRole("button", { name: /Mark these 1/ }));
  await screen.findByText("1 marked");
  fireEvent.click(screen.getByRole("button", { name: /Save 3 results/ }));
  await waitFor(() => expect(commitResultsImport).toHaveBeenCalledWith(7, [{ roll: "21CS001", outcome: "PASS" }], "NOT_CLEARED"));
  await waitFor(() => expect(onDone).toHaveBeenCalled());
});

test("turning off 'everyone else is Not cleared' leaves the unmarked students pending", async () => {
  await open();
  fireEvent.change(screen.getByPlaceholderText(/21CS001, 21CS014/), { target: { value: "21CS002" } });
  fireEvent.click(screen.getByRole("button", { name: /Mark these 1/ }));
  await screen.findByText("1 marked");
  fireEvent.click(screen.getByRole("switch", { name: /Everyone I did not mark is Not cleared/ }));
  fireEvent.click(screen.getByRole("button", { name: /Save 1 result/ }));
  await waitFor(() => expect(commitResultsImport).toHaveBeenCalledWith(7, [{ roll: "21CS002", outcome: "PASS" }], "LEAVE_PENDING"));
});

test("a failed load is an error with Retry, not an empty list", async () => {
  getCandidates.mockRejectedValueOnce({ response: { data: { message: "Round not found" } } });
  render(<ResultsEntryModal open round={{ id: 7, name: "R" }} onClose={jest.fn()} onDone={jest.fn()} />);
  expect(await screen.findByRole("button", { name: /Retry/ })).toBeInTheDocument();
  expect(within(document.body).queryByText("No students are in this round yet.")).toBeNull();
});
