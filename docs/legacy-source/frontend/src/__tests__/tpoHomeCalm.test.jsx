import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TpoHome from "@/pages/tpo/home";
import { getHome } from "@/api/Services/TpoHubService";
import { greeting, homeRows, needLine, nextUp } from "@/components/tpo/home/homeRows";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush, query: {}, pathname: "/tpo/home", replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { firstName: "Phani" } }) }));
jest.mock("@/api/Services/TpoHubService", () => ({ getHome: jest.fn() }));

const ok = (data) => Promise.resolve({ data: { status: "success", data } });
const HOME = {
  needsYou: [
    { type: "REGISTRATION_CLOSED", title: "Invite 1 batch to register", count: 50, link: "/tpo/batches", priority: 0 },
    { type: "NO_DEADLINE", title: "Set an application deadline for Razorpay · Support", count: 1, link: "/tpo/drives/47", priority: 1 },
  ],
  followUps: [],
  numbers: { registered: 14, placedUnique: 2, placedPct: 14.3, liveDrives: 10, offers: 2 },
  batches: [{ batchId: 8, name: "2026-2027 Batch", eligible: 50, registered: 14, placed: 2, invitedAt: null }],
  thisWeek: [{ title: "Techasoft · Technical interview", startsAt: "2030-01-07T04:30:00Z" }],
  checklist: [{ label: "Decide who is in placements", done: true, link: "/tpo/batches" }],
  companyFunnel: { recruiterLeads: 1 },
};

beforeEach(() => { jest.clearAllMocks(); });

test("the page is a greeting, one line, one Next up card and seven rows (Team added by Team module V1)", async () => {
  getHome.mockReturnValue(ok(HOME));
  render(<TpoHome />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Good (morning|afternoon|evening), Phani/);
  expect(await screen.findByTestId("home.need-line")).toHaveTextContent("Two things need you today.");
  expect(screen.getByText("Invite the 2026-2027 Batch to register")).toBeInTheDocument();
  expect(screen.getAllByRole("button").filter((b) => b.dataset.testid?.startsWith("home.row."))).toHaveLength(7);
  expect(screen.getByTestId("home.row.batches")).toHaveTextContent("2026-2027 Batch · 14 of 50 registered, 2 placed");
  expect(screen.getByTestId("home.row.drives")).toHaveTextContent("10 live · 1 has no deadline");
  expect(screen.getByTestId("home.row.inbox")).toHaveTextContent("No requests or messages waiting");
  // a dot only where something needs the placement cell
  expect(screen.getByTestId("home.row.batches").querySelector('[aria-label="Needs you"]')).not.toBeNull();
  expect(screen.getByTestId("home.row.students").querySelector('[aria-label="Needs you"]')).toBeNull();
});

test("the one button and every row go to their page", async () => {
  getHome.mockReturnValue(ok(HOME));
  render(<TpoHome />);
  fireEvent.click(await screen.findByRole("button", { name: "Invite 36 students" }));
  expect(mockPush).toHaveBeenCalledWith("/tpo/batches/8");
  fireEvent.click(screen.getByTestId("home.row.drives"));
  expect(mockPush).toHaveBeenLastCalledWith("/tpo/drives");
  fireEvent.click(screen.getByTestId("home.row.week"));
  expect(mockPush).toHaveBeenLastCalledWith("/tpo/calendar");
});

test("with nothing waiting it says so, calmly", async () => {
  getHome.mockReturnValue(ok({ ...HOME, needsYou: [], batches: [{ ...HOME.batches[0], invitedAt: "2026-10-01T00:00:00" }] }));
  render(<TpoHome />);
  expect(await screen.findByText("You're all caught up.")).toBeInTheDocument();
  expect(screen.getByText("Nothing is waiting on you.")).toBeInTheDocument();
});

test("a failed load shows an error with Retry, and Retry loads again", async () => {
  getHome.mockReturnValueOnce(Promise.reject({ response: { data: { message: "Server down" } } })).mockReturnValue(ok(HOME));
  render(<TpoHome />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't/i);
  fireEvent.click(screen.getByRole("button", { name: /Retry/ }));
  await waitFor(() => expect(screen.getByTestId("home.need-line")).toBeInTheDocument());
});

test("a failed background refresh keeps the last good home but marks it stale", async () => {
  getHome
    .mockReturnValueOnce(ok(HOME))
    .mockImplementationOnce(() => Promise.reject({ response: { data: { message: "Refresh unavailable" } } }));
  render(<TpoHome />);
  await screen.findByTestId("home.need-line");

  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  document.dispatchEvent(new Event("visibilitychange"));

  expect(await screen.findByText("Home refresh failed. Showing the last successful snapshot.")).toBeInTheDocument();
  expect(screen.getByTestId("home.row.drives")).toHaveTextContent("10 live");
});

describe("homeRows", () => {
  test("greeting by hour", () => {
    expect(greeting(8)).toBe("Good morning");
    expect(greeting(14)).toBe("Good afternoon");
    expect(greeting(20)).toBe("Good evening");
  });

  test("Next up is the most urgent task; with none, the next set-up step; with neither, nothing", () => {
    expect(nextUp({ needsYou: [{ type: "RESULTS_READY", title: "Apply results", link: "/x", priority: 1 }, { type: "DRIVE_REQUESTS", title: "Review", count: 2, link: "/y", priority: 0 }] }))
      .toEqual({ title: "Review", text: "Then 1 more thing after this.", action: "Review requests", href: "/y" });
    expect(nextUp({ needsYou: [], checklist: [{ label: "Choose the placement rules", done: false, link: "/tpo/settings" }] }).action).toBe("Start");
    expect(nextUp({ needsYou: [], checklist: [{ label: "x", done: true }] })).toBeNull();
  });

  test("Inbox joins requests and messages; Engage flags follow-ups and recruiters waiting", () => {
    const rows = homeRows({ needsYou: [{ type: "REQUESTS", count: 3 }, { type: "RECRUITER_MESSAGES", count: 1 }, { type: "RECRUITER_ACCESS", count: 2 }], followUps: [{}], numbers: {}, companyFunnel: { recruiterLeads: 4 } });
    const by = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(by.inbox.status).toBe("3 requests · 1 message to answer");
    expect(by.inbox.href).toBe("/tpo/requests");
    expect(by.engage.status).toBe("4 recruiters · 1 follow-up today · 2 new accounts to approve");
    expect(by.engage.attention).toBe(true);
    expect(needLine(rows)).toBe("Three things need you today.");
  });

  test("the line counts the same to-do items as Next up, not the rows (one row can hold several)", () => {
    const data = { needsYou: [
      { type: "DEADLINE_TODAY", title: "Deadline today", priority: 0, link: "/a" }, { type: "NO_DEADLINE", title: "b", priority: 1, link: "/b" },
      { type: "CLOSING_SOON", title: "c", priority: 2, link: "/c" }, { type: "REQUESTS", count: 1, title: "d", priority: 3, link: "/d" },
      { type: "RECRUITER_MESSAGES", count: 1, title: "e", priority: 4, link: "/e" },
    ], numbers: {}, companyFunnel: {}, batches: [{ batchId: 8, name: "2026-2027 Batch", eligible: 50, registered: 14, invitedAt: "2026-10-01T00:00:00" }] };
    const rows = homeRows(data);
    expect(rows.filter((r) => r.attention)).toHaveLength(2); // Drives and Inbox
    expect(needLine(rows, data)).toBe("Five things need you today.");
    expect(nextUp(data).text).toBe("Then 4 more things after this.");
    const clear = { needsYou: [], batches: data.batches };
    expect(needLine(homeRows(clear), clear)).toBe("You're all caught up.");
    // no batch yet: no to-do item, but the eligibility row has a dot, so the line does not say "all caught up"
    expect(needLine(homeRows({ needsYou: [] }), { needsYou: [] })).toBe("One thing needs you today.");
  });
});
