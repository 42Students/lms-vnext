/**
 * The recruiter's bell: the badge is one number polled every 30 seconds (the feed is fetched only when the panel opens),
 * items since the last look carry a dot, opening the panel reads them, and every item is a real button.
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import RecruiterNotificationBell from "@/components/recruiter/RecruiterNotificationBell";
import { getRecruiterNotifications, getRecruiterNotificationsUnread, markRecruiterNotificationsRead } from "@/api/Services/RecruiterService";

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

jest.mock("@/api/Services/RecruiterService", () => ({
  getRecruiterNotifications: jest.fn(),
  getRecruiterNotificationsUnread: jest.fn(),
  markRecruiterNotificationsRead: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  markRecruiterNotificationsRead.mockResolvedValue({});
  getRecruiterNotificationsUnread.mockResolvedValue({ data: { unread: 0 } });
});

test("the badge comes from the count-only call, without loading the feed", async () => {
  getRecruiterNotificationsUnread.mockResolvedValue({ data: { unread: 3 } });
  render(<RecruiterNotificationBell />);
  expect(await screen.findByText("3")).toBeInTheDocument();
  expect(getRecruiterNotifications).not.toHaveBeenCalled();
});

test("a server without the count-only call still shows the badge from the feed", async () => {
  getRecruiterNotificationsUnread.mockRejectedValue({ response: { status: 404 } });
  getRecruiterNotifications.mockResolvedValue({ data: { unread: 2, feed: [] } });
  render(<RecruiterNotificationBell />);
  expect(await screen.findByText("2")).toBeInTheDocument();
});

test("opening the panel lists notifications, marks the new ones, then reads them", async () => {
  getRecruiterNotificationsUnread.mockResolvedValue({ data: { unread: 1 } });
  getRecruiterNotifications.mockResolvedValue({ data: { unread: 1, feed: [
    { id: 1, title: "New message: Complete College", body: "Any update?", link: "/recruiter/messages", isNew: true, createdAt: new Date().toISOString() },
    { id: 2, title: "Drive approved", body: null, link: "/recruiter/drives/9", isNew: false, createdAt: new Date().toISOString() },
  ] } });
  render(<RecruiterNotificationBell />);
  await screen.findByText("1");
  fireEvent.click(screen.getByTestId("recruiter.notification-bell"));
  expect(await screen.findByText("New message: Complete College")).toBeInTheDocument();
  expect(screen.getAllByText("New notification.")).toHaveLength(1);
  await waitFor(() => expect(markRecruiterNotificationsRead).toHaveBeenCalledTimes(1));
});

test("keeps the last feed visible while a reopen refreshes and if that refresh fails", async () => {
  getRecruiterNotifications.mockResolvedValueOnce({ data: { unread: 0, feed: [
    { id: 7, title: "Existing notification", body: null, link: "/recruiter/drives/7", isNew: false, createdAt: new Date().toISOString() },
  ] } });

  render(<RecruiterNotificationBell />);
  const bell = await screen.findByTestId("recruiter.notification-bell");
  fireEvent.click(bell);
  expect(await screen.findByText("Existing notification")).toBeInTheDocument();

  const refresh = deferred();
  getRecruiterNotifications.mockReturnValueOnce(refresh.promise);
  fireEvent.click(bell);

  expect(screen.getByText("Existing notification")).toBeInTheDocument();
  expect(screen.getByText("Refreshing notifications…")).toBeInTheDocument();

  await act(async () => { refresh.reject(new Error("refresh failed")); });

  expect(await screen.findByText("Couldn't refresh your notifications")).toBeInTheDocument();
  expect(screen.getByText("Existing notification")).toBeInTheDocument();
});

test("an empty feed shows an empty state and reads nothing", async () => {
  getRecruiterNotifications.mockResolvedValue({ data: { unread: 0, feed: [] } });
  render(<RecruiterNotificationBell />);
  fireEvent.click(await screen.findByTestId("recruiter.notification-bell"));
  expect(await screen.findByText(/Nothing yet/)).toBeInTheDocument();
  expect(markRecruiterNotificationsRead).not.toHaveBeenCalled();
});

test("a failed load shows an inline error with Retry", async () => {
  getRecruiterNotifications.mockRejectedValue({ response: { data: { message: "down" } } });
  render(<RecruiterNotificationBell />);
  fireEvent.click(await screen.findByTestId("recruiter.notification-bell"));
  expect(await screen.findByText(/load your notifications/)).toBeInTheDocument();
  getRecruiterNotifications.mockResolvedValue({ data: { unread: 0, feed: [] } });
  fireEvent.click(screen.getByRole("button", { name: /Retry/i }));
  expect(await screen.findByText(/Nothing yet/)).toBeInTheDocument();
});

test("a notification is a button: it navigates and closes the panel", async () => {
  getRecruiterNotifications.mockResolvedValue({ data: { unread: 0, feed: [{ id: 1, title: "Drive approved", body: null, link: "/recruiter/drives/9", isNew: false, createdAt: new Date().toISOString() }] } });
  const onNavigate = jest.fn();
  render(<RecruiterNotificationBell onNavigate={onNavigate} />);
  fireEvent.click(await screen.findByTestId("recruiter.notification-bell"));
  const item = (await screen.findByText("Drive approved")).closest("button");
  expect(item).not.toBeNull();
  fireEvent.click(item);
  expect(onNavigate).toHaveBeenCalledWith("/recruiter/drives/9");
});

// BE-0137: with unread notifications beyond the 40 shown, opening the bell doesn't mark them all read; the person can.
test("hidden older unread aren't swallowed by opening the bell", async () => {
  getRecruiterNotificationsUnread.mockResolvedValue({ data: { unread: 45 } });
  getRecruiterNotifications.mockResolvedValue({ data: { unread: 40, unreadTotal: 45, feed: [
    { id: 1, title: "Drive approved", body: null, link: "/recruiter/drives/9", isNew: true, createdAt: new Date().toISOString() },
  ] } });
  render(<RecruiterNotificationBell />);
  fireEvent.click(await screen.findByTestId("recruiter.notification-bell"));
  expect(await screen.findByTestId("recruiter.bell.older-unread")).toHaveTextContent("5 older unread notifications");
  expect(markRecruiterNotificationsRead).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Mark all read"));
  await waitFor(() => expect(markRecruiterNotificationsRead).toHaveBeenCalledTimes(1));
});
