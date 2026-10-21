/** Recruiter phase 1, N14: on the TPO's drive page nothing is sent back; changes are requested and answered in place. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChangeRequests, { appliedText, valueText } from "@/components/tpo/drive/ChangeRequests";
import { acceptChangeRequest, createChangeRequest, listChangeRequests } from "@/api/Services/TpoService";

jest.mock("@/api/Services/TpoService", () => ({
  listChangeRequests: jest.fn(), createChangeRequest: jest.fn(), acceptChangeRequest: jest.fn(), answerChangeRequest: jest.fn(),
  replyChangeRequest: jest.fn(), withdrawChangeRequest: jest.fn(),
}));
jest.setTimeout(30000);
const ok = (data) => Promise.resolve({ data: { status: "success", data } });

beforeEach(() => jest.clearAllMocks());

test("a company request is accepted in one click and an institutional request can be withdrawn", async () => {
  listChangeRequests.mockReturnValue(ok([
    { id: 1, direction: "COMPANY_TO_COLLEGE", field: "DEADLINE", fieldLabel: "Application deadline", kind: "PROPOSE", currentValue: "2026-10-20T18:00", proposedValue: "2026-10-23T18:00", status: "OPEN", createdAt: "2026-10-11T10:00:00" },
    { id: 2, direction: "COLLEGE_TO_COMPANY", field: "STIPEND", fieldLabel: "Monthly stipend", kind: "ASK", status: "OPEN", createdAt: "2026-10-11T09:00:00" },
  ]));
  acceptChangeRequest.mockReturnValue(ok({ status: "ACCEPTED" }));
  render(<ChangeRequests jobId={5} />);
  expect(await screen.findByText("Company requests")).toBeInTheDocument();
  // Stored in UTC, shown in the reader's own time, never as the raw stored string.
  expect(screen.queryByText("2026-10-23T18:00")).not.toBeInTheDocument();
  expect(screen.getAllByText(/Oct 2026/).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Withdraw" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  await waitFor(() => expect(acceptChangeRequest).toHaveBeenCalledWith(1));
});

test("Request a change asks for a field and either a value or a question, and never says send back", async () => {
  listChangeRequests.mockReturnValue(ok([]));
  createChangeRequest.mockReturnValue(ok({ open: 1 }));
  render(<ChangeRequests jobId={5} />);
  fireEvent.click(await screen.findByRole("button", { name: "Request a change" }));
  expect(await screen.findByText(/nothing is sent back/)).toBeInTheDocument();
  expect(screen.queryByText(/send back/i)).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(await screen.findByText("Monthly stipend"));
  fireEvent.click(await screen.findByLabelText("Ask them for it"));
  fireEvent.click(screen.getByRole("button", { name: "Send to the company" }));
  await waitFor(() => expect(createChangeRequest).toHaveBeenCalledWith(5, { field: "STIPEND", kind: "ASK", proposedValue: null, note: null }));
});

test("the recruiter answers Institutional requests from the placement cell with the same panel", async () => {
  const api = {
    list: jest.fn(() => ok([{ id: 7, direction: "COLLEGE_TO_COMPANY", field: "STIPEND", fieldLabel: "Monthly stipend", kind: "ASK", status: "OPEN", createdAt: "2026-10-11T09:00:00" }])),
    create: jest.fn(), accept: jest.fn(), answer: jest.fn(() => ok({ status: "ANSWERED" })), reply: jest.fn(), withdraw: jest.fn(),
  };
  render(<ChangeRequests jobId={5} side="company" api={api} />);
  expect(await screen.findByText("Institutional requests")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Answer" }));
  fireEvent.change(await screen.findByLabelText("Your answer"), { target: { value: "25000" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(api.answer).toHaveBeenCalledWith(7, "25000"));
});

test("on a live drive, accepting a change to its terms says the students who applied were told (19 Oct 2026)", () => {
  expect(appliedText("DEADLINE", true)).toBe("Applied. Students who applied were told.");
  expect(appliedText("MIN_CGPA", true)).toBe("Applied. Students who applied were told.");
  expect(appliedText("ROLE_TITLE", true)).toBe("Accepted and applied"); // a new title is not a change of terms
  expect(appliedText("DEADLINE", false)).toBe("Accepted and applied"); // nobody has applied to a drive that is not live
});

test("values read the way people say them", () => {
  expect(valueText("MODE", "OFF_CAMPUS")).toBe("Off campus");
  expect(valueText("CTC_LPA", "6.5")).toBe("6.5 LPA");
  expect(valueText("DEADLINE", "not a date")).toBe("not a date");
});
