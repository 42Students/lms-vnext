/**
 * recruiter's inbox (hr/messages.js): this college's threads, newest first, with search and unread
 * badges. A session belongs to one college, so opening a thread goes straight to its drive and
 * nothing names or switches to another college.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import moment from "moment";
import RecruiterMessagesPage from "@/pages/recruiter/messages";
import { getHrAllThreads, getHrThread } from "@/api/Services/RecruiterService";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/RecruiterService", () => ({
  getHrAllThreads: jest.fn(),
  getRecruiterMe: jest.fn(() => Promise.resolve({ data: { scope: "COLLEGE", collegeId: 1, user: { id: 5 } } })),
  getHrThread: jest.fn(() => Promise.resolve({ data: [{ id: 9, senderType: "TPO", body: "Welcome aboard", createdAt: "2026-10-01T10:00:00" }] })),
  sendRecruiterMessage: jest.fn(() => Promise.resolve({ data: { threadId: 2 } })),
}));

const threads = [
  { id: 1, collegeId: 1, collegeName: "Complete College", jobId: 901, subject: "Acme · Engineer", lastBody: "Any update on shortlisting?", unread: 2, lastMessageAt: moment().subtract(1, "hour").toISOString() },
  { id: 2, collegeId: 1, collegeName: "Complete College", jobId: null, subject: "General", lastBody: "Welcome aboard", unread: 0, lastMessageAt: moment().subtract(2, "days").toISOString() },
];

beforeEach(() => {
  jest.clearAllMocks();
  getHrAllThreads.mockResolvedValue({ data: threads });
});

test("lists the threads with unread counts and no college tags", async () => {
  render(<RecruiterMessagesPage />);
  expect(await screen.findByText("Acme · Engineer")).toBeInTheDocument();
  expect(screen.getByText("General")).toBeInTheDocument();
  expect(screen.getByText("2 new")).toBeInTheDocument();
  expect(screen.getByText(/2 unread across 2 conversations/)).toBeInTheDocument();
  expect(screen.queryByText("Complete College")).not.toBeInTheDocument();
});

test("search appears once there are more than six conversations, and filters by subject or message body", async () => {
  getHrAllThreads.mockResolvedValue({ data: [...threads, ...[3, 4, 5, 6, 7].map((id) => ({ id, jobId: 900 + id, subject: `Drive ${id}`, lastBody: "x", unread: 0 }))] });
  render(<RecruiterMessagesPage />);
  await screen.findByText("Acme · Engineer");
  fireEvent.change(screen.getByPlaceholderText("Search by drive or message"), { target: { value: "welcome" } });
  expect(screen.queryByText("Acme · Engineer")).not.toBeInTheDocument();
  expect(screen.getByText("General")).toBeInTheDocument();
});

test("clicking a drive thread opens that drive", async () => {
  render(<RecruiterMessagesPage />);
  fireEvent.click(await screen.findByTestId("recruiter.messages.thread-1"));
  expect(mockPush).toHaveBeenCalledWith("/recruiter/drives/901?tab=messages");
});

test("a General thread (no jobId) opens right here, readable and answerable (it used to send the recruiter to Home)", async () => {
  render(<RecruiterMessagesPage />);
  fireEvent.click(await screen.findByTestId("recruiter.messages.thread-2"));
  expect(mockPush).not.toHaveBeenCalled();
  expect(await screen.findAllByText("Welcome aboard")).not.toHaveLength(0);
  expect(await screen.findByPlaceholderText("Write to the placement cell")).toBeInTheDocument();
});

test("shows an empty state when there are no messages yet", async () => {
  getHrAllThreads.mockResolvedValue({ data: [] });
  render(<RecruiterMessagesPage />);
  expect(await screen.findByText(/No messages yet/)).toBeInTheDocument();
});


test("a failed General history load is not presented as an empty, replyable conversation", async () => {
  getHrThread.mockRejectedValueOnce(new Error("history unavailable"));
  render(<RecruiterMessagesPage />);

  fireEvent.click(await screen.findByTestId("recruiter.messages.thread-2"));

  expect(await screen.findByText(/Could not load this conversation/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Retry the conversation before replying")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  expect(screen.queryByText("No messages yet. Questions that are not about one drive go here.")).not.toBeInTheDocument();
});
