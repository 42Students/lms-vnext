/**
 * Step 13 (N12) and Announcements V2 (backend docs/tpo-announcements/ANNOUNCEMENTS-V2-2026-10-12.md): the placement cell picks who an
 * announcement is for and sees the reach before sending, can undo, sees who has read it and reminds the rest; students read theirs;
 * 42 writes to placement cells.
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import TpoAnnouncements from "@/pages/tpo/announcements";
import MyPlacementAnnouncements from "@/pages/learn/my-placements/announcements";
import AnnouncementList, { Linkified, readsLine } from "@/components/tpo/announcements/AnnouncementList";
import { audienceOf, audienceReady } from "@/components/tpo/announcements/AnnouncementComposer";
import {
  getAnnouncementAudiences, getAnnouncementUnreadBy, getAnnouncementsFrom42, getFrom42Unread, getMyAnnouncements, getStudentAnnouncements,
  postAnnouncement, previewAnnouncementReach, remindAnnouncement,
} from "@/api/Services/TpoHubService";

let mockQuery = {};
jest.setTimeout(30000);
jest.mock("next/router", () => ({ useRouter: () => ({ query: mockQuery, isReady: true, pathname: "/tpo/announcements", replace: jest.fn(), push: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 3 } }) }));
jest.mock("@/layouts/PlacementsTabsLayout", () => (page) => page);
jest.mock("@/api/Services/TpoHubService", () => ({
  getMyAnnouncements: jest.fn(), postAnnouncement: jest.fn(), updateAnnouncement: jest.fn(), deleteAnnouncement: jest.fn(),
  getAnnouncementsFrom42: jest.fn(), getStudentAnnouncements: jest.fn(), getAnnouncementAudiences: jest.fn(), previewAnnouncementReach: jest.fn(),
  undoAnnouncement: jest.fn(), getAnnouncementUnreadBy: jest.fn(), remindAnnouncement: jest.fn(), getFrom42Unread: jest.fn(), getDriveEligibility: jest.fn(() => Promise.resolve({ data: null })), getPlacementJourney: jest.fn(() => Promise.resolve({ data: { applications: [], schedule: [], offers: [] } })), getDriveProcess: jest.fn(() => Promise.resolve({ data: [] })), getPlacementRules: jest.fn(() => Promise.resolve({ data: { points: [{ title: "Offers you can hold", text: "One offer at a time." }] } })), getApplyChecks: jest.fn(() => Promise.resolve({ data: {} })), getPlacementOverview: jest.fn(() => Promise.resolve({ data: { registration: {}, offers: [], schedule: [], requests: [], debarments: [], notices: [] } })) }));
const ok = (data) => Promise.resolve({ data: { status: "success", data } });

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {};
  getFrom42Unread.mockReturnValue(ok({ unread: 2 }));
  getAnnouncementAudiences.mockReturnValue(ok({ batches: [{ id: 5, name: "2026 batch" }], branches: ["CSE", "ECE"], drives: [{ id: 40, label: "Omega · SDE" }], emailReady: false }));
});

test("the cell's list says who each went to, and how many of them read it; From 42 shows what's new", async () => {
  getMyAnnouncements.mockReturnValue(ok([
    { id: 1, title: "Omega shortlist", body: "Check https://forms.gle/abc today", audienceLabel: "Omega · SDE: still in the drive", state: "SENT", recipientCount: 120, readCount: 84,
      linkLabel: "Register", linkUrl: "https://forms.gle/abc", authorName: "Anitha", sentAt: "2026-10-12T09:00:00" },
    { id: 2, title: "Mock test", body: "Friday", audienceLabel: "2026 batch", state: "SCHEDULED", sendAt: "2099-10-13T02:30:00", authorName: "Anitha" },
  ]));
  render(<TpoAnnouncements />);
  expect(await screen.findByText("Omega · SDE: still in the drive")).toBeInTheDocument();
  expect(screen.getByText("84 of 120 read")).toBeInTheDocument();
  expect(screen.getByText(/Scheduled for/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Register/ })).toHaveAttribute("href", "https://forms.gle/abc");
  expect(screen.getAllByRole("link", { name: "https://forms.gle/abc" })[0]).toHaveAttribute("target", "_blank");
  expect(await screen.findByText("From 42")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument(); // the From 42 unread badge
});

test("a new announcement shows its reach before sending, then can be undone", async () => {
  getMyAnnouncements.mockReturnValue(ok([]));
  previewAnnouncementReach.mockReturnValue(ok({ count: 120, label: "Students in placements", withEmail: 110, emailReady: false }));
  postAnnouncement.mockReturnValue(ok({ id: 9, studentsTold: 120, recipients: 120, undoSeconds: 30 }));
  render(<TpoAnnouncements />);
  fireEvent.click(await screen.findByRole("button", { name: /New announcement/ }));
  fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Pre-placement talk" } });
  fireEvent.change(screen.getByLabelText("Announcement"), { target: { value: "Omega talks on Monday at 3." } });
  expect(await screen.findByText(/Goes to/)).toBeInTheDocument();
  expect(screen.getByTestId("announcement.reach")).toHaveTextContent("Goes to 120 students · Students in placements");
  expect(screen.queryByText(/Also email it/)).not.toBeInTheDocument(); // students get email only for sign-in and interviews
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Send to 120 students" })); });
  await waitFor(() => expect(postAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ title: "Pre-placement talk", audience: { kind: "PLACEMENTS" }, sendAt: null })));
  expect(await screen.findByRole("button", { name: "Undo" })).toBeInTheDocument();
});

test("who hasn't read it, and remind only them", async () => {
  getMyAnnouncements.mockReturnValue(ok([{ id: 1, title: "Omega shortlist", body: "b", audienceLabel: "2026 batch", state: "SENT", recipientCount: 3, readCount: 1 }]));
  getAnnouncementUnreadBy.mockReturnValue(ok([{ learnerId: 7, name: "Kiran Rao", roll: "21A1", branch: "CSE" }, { learnerId: 8, name: "Asha", roll: "21A2" }]));
  remindAnnouncement.mockReturnValue(ok({ reminded: 2 }));
  render(<TpoAnnouncements />);
  fireEvent.click(await screen.findByRole("button", { name: "Who hasn't read" }));
  expect(await screen.findByText("Kiran Rao")).toBeInTheDocument();
  const drawer = screen.getByRole("dialog");
  fireEvent.click(within(drawer).getByRole("button", { name: "Remind them" }));
  await waitFor(() => expect(remindAnnouncement).toHaveBeenCalledWith(1));
});

test("a student reads theirs: who it was for when narrowed, the drive's button, and new ones marked", async () => {
  // The student page reads the plain list the endpoint returns.
  getStudentAnnouncements.mockReturnValue(Promise.resolve({ data: [
    { id: 4, title: "Omega shortlist", body: "You are in", unread: true, forYou: "Omega · SDE: still in the drive", jobId: 40, authorName: "Placement cell", createdAt: "2026-10-12T09:00:00" },
    { id: 5, title: "Holiday", body: "Closed Friday", unread: false, forYou: null, authorName: "Placement cell", createdAt: "2026-10-11T09:00:00" },
  ] }));
  render(<MyPlacementAnnouncements />);
  expect(await screen.findByText("For Omega · SDE: still in the drive")).toBeInTheDocument();
  expect(screen.getByText("New")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open the drive" })).toHaveAttribute("href", "/learn/my-placements/jobs/40");
});

test("From 42 lists what 42 sent, with what is new marked", async () => {
  mockQuery = { tab: "from42" };
  getAnnouncementsFrom42.mockReturnValue(ok([{ id: 7, title: "New: recruiter workspace", body: "Recruiters can now review drives.", unread: true, authorName: "42", createdAt: "2026-10-11T09:00:00" }]));
  render(<TpoAnnouncements />);
  expect(await screen.findByText("New: recruiter workspace")).toBeInTheDocument();
  expect(screen.getByText("New")).toBeInTheDocument();
});

test("helpers: audiences, reads in words, links", () => {
  expect(audienceOf({ kind: "DRIVE", jobId: 40 })).toEqual({ kind: "DRIVE", jobId: 40, stage: "APPLIED" });
  expect(audienceReady(audienceOf({ kind: "BATCHES", batchIds: [] }))).toBe(false);
  expect(audienceReady(audienceOf({ kind: "PLACEMENTS" }))).toBe(true);
  expect(readsLine({ readCount: 3, recipientCount: 12 }, "placement cells read")).toBe("3 of 12 placement cells read");
  const { container } = render(<p><Linkified text="See http://plain.example and https://ok.example/x." /></p>);
  expect(container.querySelectorAll("a")).toHaveLength(1); // only https links become links
  render(<AnnouncementList mode="superadmin" items={[{ id: 1, title: "t", body: "b", audienceLabel: "Every placement cell", recipientCount: 12, readCount: 3 }]} />);
  expect(screen.getByText("3 of 12 placement cells read")).toBeInTheDocument();
});
