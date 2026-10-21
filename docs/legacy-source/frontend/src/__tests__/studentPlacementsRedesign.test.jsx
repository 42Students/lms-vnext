/**
 * Student placements redesign (14 Oct 2026): Home without counts, Schedule on the placement cell's own rounds, Applications with
 * each drive's real rounds, Offers with the accept-impact check, the registration choice ticked, a cancelled drive explained.
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import moment from "moment";
import Home from "@/pages/learn/my-placements/index";
import Schedule from "@/pages/learn/my-placements/schedule";
import Applications from "@/pages/learn/my-placements/applications";
import Offers from "@/pages/learn/my-placements/offers";
import PlacementCellContent from "@/components/Placements/PlacementCellContent";
import DriveJourney from "@/components/Placements/student/DriveJourney";
import { standing } from "@/components/Placements/student/words";
import {
  getPlacementJourney, getPlacementOverview, confirmMyRound, requestRoundReschedule, respondToTpoOffer, raiseStudentRequest, getApplyChecks,
} from "@/api/Services/TpoHubService";
import { previewOfferAccept, withdrawApplication } from "@/api/Services/jobService";
import Api from "@/api/ApiMethod";

const mockRouter = { isReady: true, pathname: "/learn/my-placements", query: {}, push: jest.fn(), replace: jest.fn() };
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("react-redux", () => ({ useSelector: (sel) => sel({ loginUser: { id: 42, firstName: "Akhil", collegeId: 6 } }) }));
jest.mock("@/layouts/PlacementsTabsLayout", () => (page) => page);
jest.mock("@/components/Placements/PlacementsCompanyAvatar", () => function MockAvatar() { return null; });
jest.mock("@/api/ApiMethod", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("@/api/Services/interviewService", () => ({ getInterviewsForLearner: jest.fn(() => Promise.resolve({ data: { data: [] } })) }));
jest.mock("@/api/Services/jobService", () => ({ previewOfferAccept: jest.fn(), withdrawApplication: jest.fn() }));
jest.mock("@/utils/uploadToR2", () => ({ uploadFileViaPresign: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getPlacementJourney: jest.fn(), getPlacementOverview: jest.fn(), getDriveProcess: jest.fn(() => Promise.resolve({ data: [] })),
  confirmMyRound: jest.fn(), requestRoundReschedule: jest.fn(), respondToTpoOffer: jest.fn(), raiseStudentRequest: jest.fn(),
  registerForPlacements: jest.fn(), getApplyChecks: jest.fn(() => Promise.resolve({ data: {} })),
  getStudentCalendarExtras: jest.fn(() => Promise.resolve({ data: [] })), getCompanyPreview: jest.fn(),
  getPlacementRules: jest.fn(() => Promise.resolve({ data: { personalNote: null, points: [{ title: "Offers you can hold", text: "One offer at a time." }] } })),
}));

// Server times are UTC without an offset.
const utc = (m) => m.clone().utc().format("YYYY-MM-DDTHH:mm:ss");
const tomorrow10 = utc(moment().add(1, "day").hour(10).minute(0).second(0));
const lastWeek = utc(moment().subtract(7, "days").hour(11).minute(0));

const interviewRound = {
  roundId: 11, seq: 2, kind: "INTERVIEW", name: "Technical interview", mode: "ON_CAMPUS", state: "SCHEDULED", startsAt: tomorrow10,
  room: "Room 101", booked: true, confirmedAt: null, hasSlot: true, moveAsk: null, whatToBring: "College ID",
};
const testRound = { roundId: 10, seq: 1, kind: "TEST", name: "Online test", state: "CLEARED", startsAt: lastWeek, booked: true, moveAsk: null };
const hrRound = { roundId: 12, seq: 3, kind: "INTERVIEW", name: "HR interview", state: "LATER", startsAt: null, booked: false, moveAsk: null };
const liveApp = {
  applicationId: 501, jobId: 47, company: "Test Industry Co", role: "Graduate Engineer Trainee", status: "INTERVIEW", lifecycle: "PUBLISHED",
  live: true, withdraw: "REQUEST", appliedAt: lastWeek, rounds: [testRound, interviewRound, hrRound], offer: null,
};
const offer = {
  offerId: 900, applicationId: 502, jobId: 48, company: "Infosys", role: "Systems Engineer", status: "RELEASED", ctcLpa: 6.5,
  respondBy: utc(moment().add(20, "hours")),
};
const offeredApp = { applicationId: 502, jobId: 48, company: "Infosys", role: "Systems Engineer", status: "OFFERED", lifecycle: "PUBLISHED", live: false, withdraw: null, rounds: [], offer };
const scheduleItem = { ...interviewRound, applicationId: 501, jobId: 47, company: "Test Industry Co", role: "Graduate Engineer Trainee", live: true, expected: false };
const pastItem = { ...testRound, applicationId: 501, jobId: 47, company: "Test Industry Co", role: "Graduate Engineer Trainee", live: true };

const overview = (extra = {}) => ({ registration: { choice: "PLACEMENTS", registrationOpen: false }, offers: [], schedule: [], requests: [], debarments: [], notices: [], ...extra });

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter.query = {};
  Api.get.mockResolvedValue({ data: { status: "success", data: [] } });
  getPlacementJourney.mockResolvedValue({ data: { applications: [liveApp], schedule: [pastItem, scheduleItem], offers: [] } });
  getPlacementOverview.mockResolvedValue({ data: overview() });
});

describe("Home", () => {
  test("leads with tomorrow's interview, lists what is waiting on them, and shows no counts", async () => {
    render(<Home />);
    const next = await screen.findByTestId("sp.next");
    expect(within(next).getByText("Technical interview · Test Industry Co")).toBeInTheDocument();
    expect(within(next).getByText(/^Tomorrow/)).toBeInTheDocument();
    expect(within(next).getByRole("button", { name: "Confirm I'll attend" })).toBeInTheDocument();
    // The hero is not listed again under "Waiting on you" (student UX audit, 20 Oct 2026).
    expect(screen.queryByText("Confirm your technical interview with Test Industry Co")).toBeNull();
    expect(screen.getByText("Nothing else is waiting on you.")).toBeInTheDocument();
    // The old stat cards and pipeline are gone.
    ["Open jobs", "Application pipeline", "None upcoming", "Nothing scheduled in the next 7 days"].forEach((t) => expect(screen.queryByText(t)).toBeNull());
  });

  test("an offer waiting for a reply comes first", async () => {
    getPlacementJourney.mockResolvedValue({ data: { applications: [liveApp, offeredApp], schedule: [scheduleItem], offers: [offer] } });
    render(<Home />);
    const next = await screen.findByTestId("sp.next");
    expect(within(next).getByText("You have an offer")).toBeInTheDocument();
    expect(within(next).getByText("Infosys · Systems Engineer")).toBeInTheDocument();
    expect(screen.queryByText("Reply to Infosys's offer")).toBeNull();
    expect(screen.getByText("Confirm your technical interview with Test Industry Co")).toBeInTheDocument();
  });

  test("an unregistered student is told to register first", async () => {
    getPlacementJourney.mockResolvedValue({ data: { applications: [], schedule: [], offers: [] } });
    getPlacementOverview.mockResolvedValue({ data: overview({ registration: { choice: null, registrationOpen: true } }) });
    render(<Home />);
    expect(await screen.findByRole("heading", { name: "Register for placements" })).toBeInTheDocument();
  });

  test("only drives the college's gate lets them into are offered as closing soon", async () => {
    getPlacementJourney.mockResolvedValue({ data: { applications: [], schedule: [], offers: [] } });
    const soon = utc(moment().add(1, "day").hour(18).minute(0));
    Api.get.mockResolvedValue({ data: { status: "success", data: [
      { id: 1, companyName: "Wipro", jobTitle: "Analyst", applicationDeadline: soon },
      { id: 2, companyName: "TCS", jobTitle: "Ninja", applicationDeadline: soon },
    ] } });
    getApplyChecks.mockResolvedValue({ data: { 1: { canApply: true }, 2: { canApply: false, code: "HELD_OFFER" } } });
    render(<Home />);
    expect(await screen.findByText("Apply to Wipro")).toBeInTheDocument();
    expect(screen.queryByText("Apply to TCS")).toBeNull();
  });

  test("a failed read is a retry, never an empty home", async () => {
    getPlacementJourney.mockRejectedValue(new Error("500"));
    render(<Home />);
    expect(await screen.findByText("We could not load your placements")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});

describe("Schedule", () => {
  test("shows the placement cell's interview under Coming up, and confirming it calls the server", async () => {
    confirmMyRound.mockResolvedValue({});
    render(<Schedule />);
    const card = (await screen.findAllByTestId("sp.event"))[0];
    expect(within(card).getByText("Please confirm")).toBeInTheDocument();
    expect(within(card).getByText("Room 101")).toBeInTheDocument();
    expect(within(card).getByText(/College ID/)).toBeInTheDocument();
    fireEvent.click(within(card).getByRole("button", { name: "Confirm I'll attend" }));
    await waitFor(() => expect(confirmMyRound).toHaveBeenCalledWith(11));
  });

  test("asking to reschedule sends the reason and the times that work, separately", async () => {
    requestRoundReschedule.mockResolvedValue({});
    render(<Schedule />);
    fireEvent.click(await screen.findByRole("button", { name: "Can't make it?" }));
    fireEvent.change(screen.getByLabelText("Why can't you make it?"), { target: { value: "Semester exam at that time" } });
    fireEvent.change(screen.getByLabelText("Times that work for you (optional)"), { target: { value: "After 2 PM" } });
    fireEvent.click(screen.getByRole("button", { name: "Send to the placement cell" }));
    await waitFor(() => expect(requestRoundReschedule).toHaveBeenCalledWith(11, "Semester exam at that time", "After 2 PM"));
  });

  test("Past shows the cleared test with its result", async () => {
    mockRouter.query = { view: "past" };
    render(<Schedule />);
    const card = await screen.findByTestId("sp.event");
    expect(within(card).getByText("Online test")).toBeInTheDocument();
    expect(within(card).getByText("Cleared")).toBeInTheDocument();
  });
});

describe("Applications", () => {
  test("each application shows its drive's own rounds, and a booked student asks the placement cell to withdraw", async () => {
    raiseStudentRequest.mockResolvedValue({});
    render(<Applications />);
    const app = await screen.findByTestId("sp.application");
    expect(within(app).getByText("Booked: Technical interview")).toBeInTheDocument();
    ["Online test", "Technical interview", "HR interview"].forEach((r) => expect(within(app).getAllByText(r).length).toBeGreaterThan(0));
    expect(within(app).getByText("Cleared")).toBeInTheDocument();
    fireEvent.click(within(app).getByRole("button", { name: "Ask to withdraw" }));
    fireEvent.change(screen.getByLabelText("Why do you want to withdraw?"), { target: { value: "Placed elsewhere" } });
    fireEvent.click(screen.getByRole("button", { name: "Send to the placement cell" }));
    await waitFor(() => expect(raiseStudentRequest).toHaveBeenCalledWith({ type: "WITHDRAWAL", jobId: 47, applicationId: 501, reason: "Placed elsewhere" }));
    expect(withdrawApplication).not.toHaveBeenCalled();
  });

  test("before any booking the student withdraws on their own", async () => {
    getPlacementJourney.mockResolvedValue({ data: { applications: [{ ...liveApp, withdraw: "SELF", rounds: [] }], schedule: [], offers: [] } });
    withdrawApplication.mockResolvedValue({});
    render(<Applications />);
    fireEvent.click(await screen.findByRole("button", { name: "Withdraw" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(withdrawApplication).toHaveBeenCalledWith(501, 42));
  });
});

describe("Offers", () => {
  test("accepting first shows what it ends, then accepts", async () => {
    getPlacementJourney.mockResolvedValue({ data: { applications: [offeredApp, liveApp], schedule: [], offers: [offer] } });
    previewOfferAccept.mockResolvedValue({ data: { data: { withdrawn: [{ applicationId: 501, companyName: "Test Industry Co", jobTitle: "GET" }], staysOpen: [], otherPendingDeclined: [] } } });
    respondToTpoOffer.mockResolvedValue({});
    render(<Offers />);
    expect(await screen.findByText("Needs your reply")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept offer" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Test Industry Co · GET")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Yes, accept" }));
    await waitFor(() => expect(respondToTpoOffer).toHaveBeenCalledWith(900, true));
  });

  test("no offers yet says what will happen", async () => {
    render(<Offers />);
    expect(await screen.findByText("No offers yet")).toBeInTheDocument();
  });
});

describe("Placement cell", () => {
  test("the saved registration choice is the one ticked", async () => {
    getPlacementOverview.mockResolvedValue({ data: overview({ registration: { choice: "PLACEMENTS", registrationOpen: true } }) });
    render(<PlacementCellContent />);
    expect(await screen.findByRole("radio", { name: /Placements/ })).toBeChecked();
    expect(screen.getByRole("button", { name: "Save my new choice" })).toBeDisabled();
    expect(await screen.findByText("Offers you can hold")).toBeInTheDocument();
  });
});

describe("Drive page", () => {
  test("a drive cancelled after the student applied says so, with the reason", async () => {
    getPlacementJourney.mockResolvedValue({ data: { applications: [{ ...liveApp, jobId: 44, company: "Zoho", role: "Developer", lifecycle: "CANCELLED", live: false, cancelReason: "The company paused hiring." }], schedule: [], offers: [] } });
    render(<DriveJourney jobId={44} unavailable />);
    expect(await screen.findByText("Zoho · Developer was cancelled")).toBeInTheDocument();
    expect(screen.getByText("The placement cell said: The company paused hiring.")).toBeInTheDocument();
  });
});

describe("standing", () => {
  test("words a student understands", () => {
    expect(standing(liveApp).label).toBe("Booked: Technical interview");
    expect(standing({ status: "REJECTED", rounds: [{ name: "Online test", state: "NOT_CLEARED" }] }).label).toBe("Not cleared: Online test");
    expect(standing({ status: "OFFERED", offer: { status: "RELEASED" } }).label).toBe("Offer: reply needed");
    expect(standing({ status: "APPLIED", lifecycle: "CANCELLED" }).label).toBe("Drive cancelled");
    expect(standing({ status: "APPLIED", rounds: [] }).label).toBe("Applied · waiting for the company");
  });
});
