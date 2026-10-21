/**
 * UI/UX audit (Batch 6/5): MessagesPanel's thread-list failure used to render as "No
 * conversations yet" and a single-thread failure as a silently empty conversation; RequestsPanel
 * had no error handling at all, so a failure looked exactly like "No requests here" on a surface
 * whose whole job is "what needs a decision."
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MessagesPanel from "@/components/tpo/MessagesPanel";
import RequestsPanel from "@/components/tpo/RequestsPanel";
import { getThread, getThreads } from "@/api/Services/TpoHubService";
import { getRequestsQueue } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {}, pathname: "/tpo/requests", push: jest.fn(), replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1, firstName: "Asha" } }) }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getThread: jest.fn(), getThreads: jest.fn(), sendMessage: jest.fn(), getRequestsQueue: jest.fn(),
  getSavedViews: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }), saveView: jest.fn(), deleteView: jest.fn(),
}));

// On a wide screen the inbox opens the first unread thread itself; these tests drive the click, so use a narrow window.
beforeEach(() => { jest.clearAllMocks(); window.innerWidth = 800; });

describe("MessagesPanel", () => {
  test("a thread-list failure shows an inline error, not \"No conversations yet\"", async () => {
    getThreads.mockRejectedValue({ response: { data: { message: "Threads down" } } });
    render(<MessagesPanel />);
    expect(await screen.findByText("Threads down")).toBeInTheDocument();
    expect(screen.queryByText("No conversations yet")).not.toBeInTheDocument();
  });

  test("a single-thread failure shows an inline error, not a silently empty conversation", async () => {
    getThreads.mockResolvedValue({ data: { status: "success", data: [{ id: 1, recruiterName: "Priya", subject: "Acme", unread: 0, lastBody: "Hi", lastSender: "TPO" }] } });
    getThread.mockRejectedValue({ response: { data: { message: "Thread fetch failed" } } });
    render(<MessagesPanel />);
    fireEvent.click(await screen.findByText("Priya"));
    expect(await screen.findByText("This conversation failed to load.")).toBeInTheDocument();
  });
});

describe("RequestsPanel", () => {
  test("a failed load shows an inline error with Retry, not \"No requests here\"", async () => {
    getRequestsQueue.mockRejectedValue({ response: { data: { message: "Requests query failed" } } });
    render(<RequestsPanel />);
    expect(await screen.findByText("Requests query failed")).toBeInTheDocument();
    expect(screen.queryByText("No requests here")).not.toBeInTheDocument();
  });
});

describe("MessagesPanel opens into the conversation that needs you", () => {
  const threads = [
    { id: 1, recruiterName: "Asha", subject: "General", unread: 0, lastBody: "ok", lastSender: "TPO" },
    { id: 2, recruiterName: "Priya", subject: "Acme", unread: 2, lastBody: "Can we move it?", lastSender: "HR" },
  ];
  test("wide screen: the first thread with unread messages opens by itself", async () => {
    window.innerWidth = 1280;
    getThreads.mockResolvedValue({ data: { status: "success", data: threads } });
    getThread.mockResolvedValue({ data: { status: "success", data: [{ id: 9, senderType: "HR", body: "Can we move it?", createdAt: "2026-10-02T10:00:00" }] } });
    render(<MessagesPanel />);
    await waitFor(() => expect(getThread).toHaveBeenCalledWith(2));
  });
  test("narrow screen: nothing opens until you choose", async () => {
    window.innerWidth = 600;
    getThreads.mockResolvedValue({ data: { status: "success", data: threads } });
    render(<MessagesPanel />);
    await screen.findByText("Priya");
    expect(getThread).not.toHaveBeenCalled();
  });
});
