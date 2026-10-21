/**
 * Team module V1 (backend docs/tpo-team/TEAM-MODULE-DESIGN-2026-10-12.md): conversations with @mentions, # links, asks and decisions;
 * the list's filters and unread; People (who's doing what, nobody owns, away).
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import TeamComposer, { fromTokens, toTokens } from "@/components/tpo/team/TeamComposer";
import TeamMessages, { askState } from "@/components/tpo/team/TeamMessages";
import TeamConversation from "@/components/tpo/team/TeamConversation";
import TeamPeople, { overdueLine } from "@/components/tpo/team/TeamPeople";
import { filterThreads } from "@/components/tpo/team/TeamConversations";
import { chipHref, parseBody, plainText } from "@/components/tpo/team/teamTokens";
import { teamRow } from "@/components/tpo/home/homeRows";
import {
  assignUnowned, getTeam, getTeamPeople, markTeamAskDone, openTeamThread, sendTeamAbout, sendTeamMessage, getTeamAbout,
} from "@/api/Services/TpoHubService";

jest.setTimeout(30000);
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), query: {}, pathname: "/tpo/messages?tab=team" }) }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getTeamThreads: jest.fn(), searchTeamThreads: jest.fn(), startTeamThread: jest.fn(), openTeamThread: jest.fn(), sendTeamMessage: jest.fn(),
  getTeamAbout: jest.fn(), sendTeamAbout: jest.fn(), addTeamThreadPeople: jest.fn(), followTeamThread: jest.fn(), muteTeamThread: jest.fn(),
  leaveTeamThread: jest.fn(), updateTeamTopic: jest.fn(), editTeamMessage: jest.fn(), deleteTeamMessage: jest.fn(), markTeamDecision: jest.fn(),
  markTeamAskDone: jest.fn(), cancelTeamAsk: jest.fn(), teamLookup: jest.fn(), getTeamPeople: jest.fn(), setTeamAway: jest.fn(), assignUnowned: jest.fn(),
  getTeam: jest.fn(), getFacultyDirectory: jest.fn(), getRemovalImpact: jest.fn(), removeTeamMember: jest.fn(), setTeamMember: jest.fn(),
}));
const ok = (data) => Promise.resolve({ data: { status: "success", data } });
const people = [{ facultyId: 12, name: "Anitha Reddy" }, { facultyId: 13, name: "Suresh Varma" }, { facultyId: 14, name: "Joseph D", awayUntil: "2099-10-16" }];

beforeEach(() => jest.clearAllMocks());

test("tokens: people and things read as words and chips, and survive an edit round trip", () => {
  const body = "@[Suresh Varma](f:13) send it to #[Omega · SDE](d:40) and #[Infosys](c:infosys) @[team](team)";
  expect(plainText(body)).toBe("@Suresh Varma send it to Omega · SDE and Infosys @team");
  const parts = parseBody(body);
  expect(parts.find((p) => p.type === "mention").id).toBe(13);
  expect(parts.filter((p) => p.type === "chip").map((p) => p.href)).toEqual(["/tpo/drives/40", "/tpo/messages?tab=team&about=COMPANY%3Ainfosys"]);
  expect(chipHref("s", "991")).toBe("/tpo/students?student=991");
  const { text, picks } = fromTokens(body);
  expect(text).toBe("@Suresh Varma send it to #Omega · SDE and #Infosys @team");
  expect(toTokens(text, picks)).toBe(body);
  // A name typed by hand is never a mention by accident.
  expect(toTokens("@Suresh hello", [])).toBe("@Suresh hello");
});

test("the composer mentions with @, sends tokens, and turns a message into an ask with a person", async () => {
  const onSend = jest.fn(() => Promise.resolve(true));
  render(<TeamComposer people={people} meId={12} onSend={onSend} />);
  const box = screen.getByLabelText("Message to the team");
  fireEvent.change(box, { target: { value: "@Su", selectionStart: 3 } });
  fireEvent.mouseDown(await screen.findByRole("option", { name: /Suresh Varma/ }));
  fireEvent.change(box, { target: { value: "@Suresh Varma please send the shortlist", selectionStart: 39 } });
  fireEvent.click(screen.getByRole("button", { name: /Ask someone/ }));
  const ask = screen.getByTestId("team.composer.ask");
  fireEvent.mouseDown(ask.querySelector(".ant-select-selector"));
  fireEvent.click(await screen.findByTitle("Suresh Varma"));
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(onSend).toHaveBeenCalledWith({ body: "@[Suresh Varma](f:13) please send the shortlist", askAssigneeId: 13, askDueAt: null, decision: false }));
});

test("asking someone who is away warns before sending", async () => {
  render(<TeamComposer people={people} meId={12} onSend={jest.fn()} initialAskAssignee={14} />);
  expect(await screen.findByText(/Joseph is away until/)).toBeInTheDocument();
});

test("Enter sends and Shift+Enter does not; nothing is sent empty", async () => {
  const onSend = jest.fn(() => Promise.resolve(true));
  render(<TeamComposer people={people} meId={12} onSend={onSend} />);
  const box = screen.getByLabelText("Message to the team");
  fireEvent.keyDown(box, { key: "Enter" });
  expect(onSend).not.toHaveBeenCalled();
  fireEvent.change(box, { target: { value: "Hall B is booked" } });
  fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
  expect(onSend).not.toHaveBeenCalled();
  fireEvent.keyDown(box, { key: "Enter" });
  await waitFor(() => expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ body: "Hall B is booked" })));
});

test("messages: day lines, system lines, decisions, removed ones and an ask only its person can mark done", () => {
  const onAskDone = jest.fn();
  render(<TeamMessages meId={13} onAskDone={onAskDone} messages={[
    { id: 1, kind: "SYSTEM", body: "Anitha added Suresh", createdAt: "2026-10-12T09:00:00" },
    { id: 2, kind: "MESSAGE", body: "Keep it on campus", authorName: "Anitha Reddy", isDecision: true, createdAt: "2026-10-12T09:05:00" },
    { id: 3, kind: "MESSAGE", body: "@[Suresh Varma](f:13) HODs please", authorName: "Anitha Reddy", createdAt: "2026-10-12T09:10:00",
      ask: { id: 7, assigneeId: 13, askedById: 12, assigneeName: "Suresh Varma", dueAt: "2099-10-12T11:30:00" } },
    { id: 4, kind: "MESSAGE", deleted: true, authorName: "Ravi", createdAt: "2026-10-12T09:20:00" },
  ]} />);
  expect(screen.getByText("Anitha added Suresh")).toBeInTheDocument();
  expect(screen.getByText("Decision")).toBeInTheDocument();
  expect(screen.getByText("Message removed")).toBeInTheDocument();
  expect(screen.getByText(/Ask/).closest("[data-testid='team.ask']")).toHaveTextContent("you");
  fireEvent.click(screen.getByRole("button", { name: "Mark done" }));
  expect(onAskDone).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  expect(askState({ dueAt: "2000-01-01T00:00:00" }).label).toBe("Overdue");
  expect(askState({ doneAt: "2026-10-12T10:00:00" }).label).toBe("Done");
});

test("mentioning someone outside a private conversation asks first, then sends with addPeople", async () => {
  openTeamThread.mockReturnValue(ok({ thread: { id: 9, kind: "TOPIC", title: "Staff matters", isPrivate: true, following: true }, messages: [], people: [], asks: [], decisions: [], context: { kind: "TOPIC" } }));
  sendTeamMessage
    .mockImplementationOnce(() => Promise.reject({ response: { status: 409, data: { code: "ADD_PEOPLE", people: ["Suresh Varma"], message: "Add Suresh?" } } }))
    .mockReturnValueOnce(ok({ id: 50, notified: 1 }));
  render(<TeamConversation threadId={9} meId={12} people={people} />);
  const box = await screen.findByLabelText("Message to the team");
  fireEvent.change(box, { target: { value: "hello" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  fireEvent.click(await screen.findByRole("button", { name: "Add and send" }));
  await waitFor(() => expect(sendTeamMessage).toHaveBeenLastCalledWith(9, expect.objectContaining({ body: "hello", addPeople: true })));
});

test("on a drive page the first message makes the drive's conversation", async () => {
  getTeamAbout.mockReturnValue(ok({ thread: { id: null, kind: "DRIVE", aboutKey: "40", title: "Omega · SDE" }, messages: [], people: [], asks: [], decisions: [], context: { kind: "DRIVE" } }));
  sendTeamAbout.mockReturnValue(ok({ id: 1, threadId: 77, notified: 0 }));
  render(<TeamConversation embedded about={{ kind: "DRIVE", key: "40" }} meId={12} people={people} />);
  expect(await screen.findByText(/The company never does/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Message to the team"), { target: { value: "Lab 3 is free" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(sendTeamAbout).toHaveBeenCalledWith("DRIVE", "40", expect.objectContaining({ body: "Lab 3 is free" })));
});

test("a decision shows pinned above the messages; an ask is marked done with a note", async () => {
  openTeamThread.mockReturnValue(ok({
    thread: { id: 9, kind: "DRIVE", title: "Omega · SDE", following: true },
    messages: [{ id: 3, kind: "MESSAGE", body: "Send to HODs", authorName: "Anitha", createdAt: "2026-10-12T09:10:00", ask: { id: 7, assigneeId: 13, askedById: 12, assigneeName: "Suresh" } }],
    decisions: [{ id: 2, body: "Test on campus, lab 3", decidedBy: "Anitha", decidedAt: "2026-10-11T10:00:00" }],
    people: [], asks: [{ id: 7, messageId: 3, body: "Send to HODs", assigneeId: 13, assigneeName: "Suresh" }], context: { kind: "DRIVE", status: "PUBLISHED", owner: "Anitha", link: "/tpo/drives/40" },
  }));
  markTeamAskDone.mockReturnValue(ok({ status: "DONE" }));
  render(<TeamConversation threadId={9} meId={13} people={people} />);
  expect(await screen.findByTestId("team.decisions")).toHaveTextContent("Test on campus, lab 3");
  expect(screen.getByTestId("team.context")).toHaveTextContent("Open the drive");
  fireEvent.click(screen.getByRole("button", { name: "Mark done" }));
  fireEvent.change(await screen.findByLabelText("Note (optional)"), { target: { value: "Sent at 3 PM" } });
  fireEvent.click(screen.getAllByRole("button", { name: "Mark done" }).pop());
  await waitFor(() => expect(markTeamAskDone).toHaveBeenCalledWith(7, "Sent at 3 PM"));
});

test("filters: Following by default, @ Me, Asks, Decisions and kinds", () => {
  const threads = [
    { id: 1, kind: "EVERYONE", following: true },
    { id: 2, kind: "DRIVE", following: true, openAsks: 1, myOpenAsks: 1 },
    { id: 3, kind: "COMPANY", following: false, mentionsAll: 2 },
    { id: 4, kind: "TOPIC", following: false, decisions: 1 },
  ];
  expect(filterThreads(threads, "following").map((t) => t.id)).toEqual([1, 2]);
  expect(filterThreads(threads, "me").map((t) => t.id)).toEqual([2, 3]);
  expect(filterThreads(threads, "asks").map((t) => t.id)).toEqual([2]);
  expect(filterThreads(threads, "decisions").map((t) => t.id)).toEqual([4]);
  expect(filterThreads(threads, "companies").map((t) => t.id)).toEqual([3]);
  expect(filterThreads(threads, "all")).toHaveLength(4);
});

test("People: who's doing what, overdue in words, away, and work nobody owns assigned", async () => {
  getTeamPeople.mockReturnValue(ok({
    people: [
      { facultyId: 12, firstName: "Anitha", lastName: "Reddy", kind: "TPO account", me: true, drivesLive: 4, drivesReview: 1, companies: 9, followUpsOverdue: 0, asksOn: 1, asksOverdue: 0, waitingOn: 3, openAsks: [] },
      { facultyId: 13, firstName: "Ravi", lastName: "Kumar", kind: "Team member", drivesLive: 3, drivesReview: 2, companies: 14, followUpsOverdue: 2, asksOn: 2, asksOverdue: 1, waitingOn: 1, awayUntil: "2099-10-16",
        openAsks: [{ id: 5, body: "Confirm the Zoho panel names", overdue: true, dueAt: "2026-10-10T10:00:00", askedByName: "Anitha", threadId: 3, messageId: 8 }] },
    ],
    unowned: { drives: [{ id: 40, label: "Omega · SDE" }], companies: [{ key: "zoho", label: "Zoho", contacts: 2 }] },
  }));
  getTeam.mockReturnValue(ok({ me: 12, members: [{ facultyId: 13 }], accounts: [{ facultyId: 12 }] }));
  assignUnowned.mockReturnValue(ok({ drives: 1, companyContacts: 2 }));
  render(<TeamPeople meId={12} />);
  expect(await screen.findByText(/Nobody owns/)).toBeInTheDocument();
  expect(screen.getAllByTestId("team.person")[0]).toHaveTextContent("Ravi Kumar"); // most work first
  expect(screen.getByText(/1 ask overdue: “Confirm the Zoho panel names”/)).toBeInTheDocument();
  expect(screen.getByText(/Away until/)).toBeInTheDocument();
  expect(screen.queryByText(/last active/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Assign them" }));
  const dialog = await screen.findByRole("dialog");
  // Nothing is picked for you: choose who, then what.
  fireEvent.mouseDown(dialog.querySelectorAll(".ant-select-selector")[0]);
  fireEvent.click(await screen.findByTitle(/Anitha Reddy/));
  fireEvent.mouseDown(dialog.querySelectorAll(".ant-select-selector")[1]);
  fireEvent.click(await screen.findByTitle("Omega · SDE"));
  await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: "Assign" })); });
  await waitFor(() => expect(assignUnowned).toHaveBeenCalledWith({ driveIds: [40], companies: [], to: 12 }));
  // The numbers open that person's work: their drives, companies and overdue follow-ups.
  expect(screen.getAllByRole("link", { name: /Drives \(live · review\)/ })[0]).toHaveAttribute("href", "/tpo/drives?f_owner=13");
});

test("overdue line and Home's Team row read in words", () => {
  expect(overdueLine({ followUpsOverdue: 2, openAsks: [] })).toBe("2 follow-ups overdue.");
  expect(teamRow({ asksOpen: 2, asksOverdue: 1, mentionsNew: 3 })).toMatchObject({ status: "2 asks for you (1 overdue) · 3 mentions", href: "/tpo/messages?tab=team&filter=me", attention: true });
  expect(teamRow({})).toMatchObject({ status: "Nothing waiting on you", attention: false });
});
