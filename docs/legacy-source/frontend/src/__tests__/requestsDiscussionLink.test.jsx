/**
 * Requests + Discussion link (12 Oct 2026): each step of a change request leaves a line in the drive's Discussion, "Discuss" quotes
 * a request in the next message, and the one-shot reply became Decline. Edge cases: backend
 * docs/recruiter-global/REQUESTS-DISCUSSION-AUDIT-2026-10-12.md.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MessagesPanel from "@/components/tpo/MessagesPanel";
import ChangeRequests, { valueText } from "@/components/tpo/drive/ChangeRequests";
import { RequestEventLine, requestSummary } from "@/components/tpo/drive/RequestLine";
import { getThread, getThreads, sendMessage } from "@/api/Services/TpoHubService";

jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1, firstName: "Asha" } }) }));
jest.mock("@/api/Services/TpoHubService", () => ({ getThreads: jest.fn(), getThread: jest.fn(), sendMessage: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  listRecruiterAccess: jest.fn(), listChangeRequests: jest.fn(), createChangeRequest: jest.fn(), acceptChangeRequest: jest.fn(),
  answerChangeRequest: jest.fn(), replyChangeRequest: jest.fn(), withdrawChangeRequest: jest.fn(),
}));
jest.setTimeout(30000);
const ok = (data) => Promise.resolve({ data: { status: "success", data } });

const request = {
  id: 41, field: "LOCATION", fieldLabel: "Location", kind: "PROPOSE", direction: "COMPANY_TO_COLLEGE", currentValue: "Hyderabad",
  proposedValue: "Pune", status: "OPEN",
};

beforeEach(() => jest.clearAllMocks());

test("a drive's Discussion opens the current recruiter's thread, not a previous recruiter's", async () => {
  getThreads.mockResolvedValue({ data: [
    { id: 1, recruiterId: 3, jobId: 5, recruiterName: "Old Recruiter" },
    { id: 2, recruiterId: 9, jobId: 5, recruiterName: "Kumar" },
  ] });
  getThread.mockResolvedValue({ data: [] });
  render(<MessagesPanel jobId={5} recruiterId={9} />);
  await waitFor(() => expect(getThread).toHaveBeenCalledWith(2));
  expect(getThread).not.toHaveBeenCalledWith(1);
});

test("request lines show who did what, are not chat bubbles, and never mark Seen", async () => {
  getThreads.mockResolvedValue({ data: [{ id: 2, recruiterId: 9, jobId: 5 }] });
  getThread.mockResolvedValue({ data: [
    { id: 10, kind: "EVENT", event: "CREATED", senderType: "RECRUITER", senderName: "Kumar", body: "Asked to change Location", createdAt: "2026-10-12T10:00:00", request },
    { id: 11, kind: "MESSAGE", senderType: "TPO", senderId: 1, body: "Looking into it", readAt: null, createdAt: "2026-10-12T10:05:00", request },
    { id: 12, kind: "EVENT", event: "DECLINED", senderType: "TPO", senderId: 1, readAt: "2026-10-12T11:00:00", body: "Declined the change to Location",
      createdAt: "2026-10-12T10:10:00", request: { ...request, status: "REPLIED", replyText: "The role is in Hyderabad only" } },
  ] });
  const see = jest.fn();
  render(<MessagesPanel jobId={5} recruiterId={9} onSeeRequest={see} />);
  expect((await screen.findAllByText("Location: Pune")).length).toBe(2); // the line, and the quote on the message
  expect(screen.getAllByTestId("drive.request-event")).toHaveLength(2);
  expect(screen.getByText(/Declined the change to Location: “The role is in Hyderabad only”/)).toBeInTheDocument();
  // The message quoting the request carries the quote; the decline line is the TPO's but is not a message, so no "Seen".
  expect(screen.getByTestId("drive.request-quote")).toBeInTheDocument();
  expect(screen.queryByText(/Seen/)).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "See the request" })[0]);
  expect(see).toHaveBeenCalledWith(41);
});

test("Discuss quotes the request: it goes out with the next message, and can be removed", async () => {
  getThreads.mockResolvedValue({ data: [{ id: 2, recruiterId: 9, jobId: 5 }] });
  getThread.mockResolvedValue({ data: [] });
  sendMessage.mockResolvedValue({ data: { threadId: 2 } });
  const clear = jest.fn();
  const { rerender } = render(<MessagesPanel jobId={5} recruiterId={9} quote={request} onQuoteClear={clear} />);
  expect(await screen.findByTestId("drive.request-quote")).toBeInTheDocument();
  await screen.findByText("No messages yet");
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Pune works if the interview is online" } });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ recruiterId: 9, jobId: 5, body: "Pune works if the interview is online", changeRequestId: 41 }));
  await waitFor(() => expect(clear).toHaveBeenCalled());
  rerender(<MessagesPanel jobId={5} recruiterId={9} quote={request} onQuoteClear={clear} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove the quoted request" }));
  expect(clear).toHaveBeenCalledTimes(2);
});

test("a message is capped at 4000 characters on screen, and text typed while the thread loads is kept", async () => {
  getThreads.mockResolvedValue({ data: [{ id: 2, recruiterId: 9, jobId: 5 }] });
  let release;
  getThread.mockReturnValue(new Promise((r) => { release = r; }));
  render(<MessagesPanel jobId={5} recruiterId={9} />);
  await waitFor(() => expect(getThread).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "x".repeat(4100) } });
  release({ data: [] });
  await waitFor(() => expect(screen.getByLabelText("Message").value.length).toBe(4000));
});

test("each request has Discuss; the one-shot reply is now Decline, with a reason", async () => {
  const api = {
    list: jest.fn(() => ok([request, { ...request, id: 42, status: "REPLIED", replyText: "Not now" }])),
    create: jest.fn(), accept: jest.fn(), answer: jest.fn(), reply: jest.fn(() => ok({ status: "REPLIED" })), withdraw: jest.fn(),
  };
  const discuss = jest.fn();
  render(<ChangeRequests jobId={5} api={api} onDiscuss={discuss} />);
  expect(await screen.findByText("Declined")).toBeInTheDocument();
  expect(screen.getAllByText("was").length).toBe(2); // the value at the time it was asked is labelled, not passed off as current
  expect(screen.queryByRole("button", { name: "Reply" })).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Discuss" })[0]);
  expect(discuss).toHaveBeenCalledWith(expect.objectContaining({ id: 41 }));
  fireEvent.click(screen.getByRole("button", { name: "Decline" }));
  expect(await screen.findByText(/To talk it over first, use Discuss instead/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Why not (they see this)"), { target: { value: "The role is in Hyderabad only" } });
  fireEvent.click(screen.getAllByRole("button", { name: "Decline" }).pop());
  await waitFor(() => expect(api.reply).toHaveBeenCalledWith(41, "The role is in Hyderabad only"));
});

test("a description reads as words, not HTML", () => {
  expect(valueText("DESCRIPTION", "<p>Build &amp; ship</p><p>APIs</p>")).toBe("Build & ship APIs");
  expect(requestSummary({ field: "OTHER", note: "Can the test be online?" })).toBe("Can the test be online?");
  expect(requestSummary({ field: "STIPEND", fieldLabel: "Monthly stipend", kind: "ASK" })).toBe("Asked for the monthly stipend");
});

test("an answered line shows the answer in the reader's terms", () => {
  render(<RequestEventLine message={{ id: 1, event: "ANSWERED", body: "Answered: Mode", request: { field: "MODE", answerValue: "OFF_CAMPUS" } }} who="Kumar" when="12 Oct" />);
  expect(screen.getByText(/Answered: Mode: Off campus/)).toBeInTheDocument();
});
