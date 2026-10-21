/** recruiter V2 pages: Drives, Calendar, Company & Team, search, and Request a drive (new, hire again, fix and resend). */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import moment from "moment";
import RecruiterDrivesPage from "@/pages/recruiter/drives/index";
import RecruiterCalendarPage from "@/pages/recruiter/calendar";
import RecruiterCompanyPage from "@/pages/recruiter/company";
import RecruiterRequestDrivePage from "@/pages/recruiter/drives/new";
import {
  getCollegeOverview, getRecruiterCalendar, getRecruiterCompany, getRecruiterMe, getRecruiterReports, getRecruiterTeam, listDriveRequests, listMyDrives, planDrive, resubmitDriveRequest,
} from "@/api/Services/RecruiterService";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockQuery = {};
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, query: mockQuery, isReady: true, pathname: "/recruiter/x" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (sel) => sel({ loginUser: { userType: "RECRUITER", collegeId: 7, collegeName: "NSRIT" } }) }));
jest.mock("@/api/Services/RecruiterService", () => ({
  getRecruiterMe: jest.fn(), listMyDrives: jest.fn(), getRecruiterCalendar: jest.fn(), getRecruiterCompany: jest.fn(), getRecruiterTeam: jest.fn(), getRecruiterReports: jest.fn(),
  getCollegeOverview: jest.fn(), listDriveRequests: jest.fn(), planDrive: jest.fn(), resubmitDriveRequest: jest.fn(),
}));

const collegeMe = { data: { scope: "COLLEGE", collegeId: 7, user: { id: 5, companyName: "Acme", collegeName: "NSRIT" } } };

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {};
  window.localStorage.clear();
  getRecruiterMe.mockResolvedValue(collegeMe);
  getCollegeOverview.mockResolvedValue({ data: { studentsTotal: 200 } });
});

describe("Drives", () => {
  const drives = [
    { id: 1, roleTitle: "Live role", lifecycle: "PUBLISHED", applicants: 12, offers: 0, deadline: moment().add(2, "days").toISOString() },
    { id: 2, roleTitle: "Sent back role", lifecycle: "REQUEST", applicants: 0, offers: 0, openRequests: 1 },
    { id: 3, roleTitle: "Old role", lifecycle: "CLOSED", applicants: 40, offers: 5 },
  ];

  test("opens on the tab that needs attention, with the drive the placement cell asked about offering Answer", async () => {
    listMyDrives.mockResolvedValue({ data: drives });
    render(<RecruiterDrivesPage />);
    expect(await screen.findByText("Sent back role")).toBeInTheDocument();
    expect(screen.queryByText("Live role")).not.toBeInTheDocument(); // it sits on the Live tab
    expect(screen.getByText("The placement cell asked about 1 thing")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Answer" }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/recruiter/drives/2?tab=messages"));
  });

  test("closed drives offer Hire again, and a live drive shows when it closes", async () => {
    listMyDrives.mockResolvedValue({ data: drives });
    const view = render(<RecruiterDrivesPage />);
    await screen.findByText("Sent back role");
    fireEvent.click(screen.getByText(/^All \(3\)/));
    // The tab lives in the URL: apply the replace the page asked for, as the router would.
    expect(mockReplace).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({ tab: "all" }) }), undefined, expect.anything());
    mockQuery = { tab: "all" };
    view.rerender(<RecruiterDrivesPage />);
    expect(await screen.findByText("Live role")).toBeInTheDocument();
    expect(screen.getByText(/Applications close in 2 days/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hire again" }));
    expect(mockPush).toHaveBeenCalledWith("/recruiter/drives/new?from=3");
  });

  test("with no drives it explains what to do and offers the request", async () => {
    listMyDrives.mockResolvedValue({ data: [] });
    render(<RecruiterDrivesPage />);
    expect(await screen.findByText(/You have no drives yet/)).toBeInTheDocument();
  });

  test("a failed load is retryable and the chooser session is told to pick a college", async () => {
    listMyDrives.mockRejectedValueOnce({ response: { data: { error: "down" } } });
    listMyDrives.mockResolvedValueOnce({ data: drives });
    render(<RecruiterDrivesPage />);
    expect(await screen.findByText("down")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Sent back role")).toBeInTheDocument();
  });

  test("a recruiter without drive access is told who can switch it on, not shown a raw 403", async () => {
    listMyDrives.mockRejectedValueOnce({ response: { status: 403, data: { message: "Missing capability DRIVE_WORK" } } });
    render(<RecruiterDrivesPage />);
    expect(await screen.findByText(/Drive access is not switched on/)).toBeInTheDocument();
    expect(screen.getByText(/Ask the placement cell/)).toBeInTheDocument();
    expect(screen.queryByText(/Missing capability/)).not.toBeInTheDocument();
  });

  test("the college-less session has no drives page content", async () => {
    getRecruiterMe.mockResolvedValue({ data: { scope: "GLOBAL", user: {} } });
    render(<RecruiterDrivesPage />);
    expect(await screen.findByText("Open this on your college's placement address")).toBeInTheDocument();
    expect(listMyDrives).not.toHaveBeenCalled();
  });
});

describe("Calendar", () => {
  test("shows the week's events by day and asks the server for exactly that week", async () => {
    const monday = moment().startOf("isoWeek");
    getRecruiterCalendar.mockResolvedValue({ data: [{ id: "round-1", type: "ROUND", title: "Round 1", jobTitle: "SDE", jobId: 5, start: monday.clone().add(1, "days").hour(10).toISOString() }] });
    render(<RecruiterCalendarPage />);
    expect(await screen.findByText("Round 1")).toBeInTheDocument();
    const [collegeId, from, to] = getRecruiterCalendar.mock.calls[0];
    expect(collegeId).toBe(7);
    expect(moment(to).diff(moment(from), "days")).toBe(7);
    // exact instants: the viewer's local Monday 00:00 (as UTC), never a zone-less local string
    expect(from).toBe(monday.toISOString());
    expect(from.endsWith("Z")).toBe(true);
    fireEvent.click(screen.getByText("Round 1"));
    expect(mockPush).toHaveBeenCalledWith("/recruiter/drives/5?tab=rounds");
  });

  test("an answer for a week the person has already left is ignored", async () => {
    let resolveFirst;
    getRecruiterCalendar.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    getRecruiterCalendar.mockResolvedValueOnce({ data: [] });
    render(<RecruiterCalendarPage />);
    await waitFor(() => expect(getRecruiterCalendar).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(await screen.findByTestId("recruiter.calendar.empty")).toBeInTheDocument();
    resolveFirst({ data: [{ id: "old", type: "ROUND", title: "Last week's round", jobTitle: "SDE", jobId: 5, start: moment().startOf("isoWeek").add(1, "days").toISOString() }] });
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Last week's round")).not.toBeInTheDocument();
  });

  test("next week asks for the following week, and an empty week says so", async () => {
    getRecruiterCalendar.mockResolvedValue({ data: [] });
    render(<RecruiterCalendarPage />);
    expect(await screen.findByTestId("recruiter.calendar.empty")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    await waitFor(() => expect(getRecruiterCalendar).toHaveBeenCalledTimes(2));
    expect(moment(getRecruiterCalendar.mock.calls[1][1]).diff(moment(getRecruiterCalendar.mock.calls[0][1]), "days")).toBe(7);
  });
});

describe("Company & Team", () => {
  test("team lists colleagues of the same company and marks me", async () => {
    mockQuery = { tab: "team" };
    getRecruiterTeam.mockResolvedValue({ data: [{ id: 1, firstName: "Ananya", lastName: "Rao", designation: "TA", email: "a@x.com", drives: 3, you: true }, { id: 2, firstName: "Dev", drives: 0, you: false }] });
    render(<RecruiterCompanyPage />);
    expect(await screen.findByText("Ananya Rao")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("3 drives here")).toBeInTheDocument();
  });

  test("company is read-only and says who manages it", async () => {
    getRecruiterCompany.mockResolvedValue({ data: { name: "Acme Corp", industry: "Software", website: "https://acme.test" } });
    render(<RecruiterCompanyPage />);
    expect(await screen.findByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText(/To change the name or logo, ask the placement cell/)).toBeInTheDocument();
  });

  test("reports show the funnel with conversion and each drive's offer outcomes", async () => {
    mockQuery = { tab: "reports" };
    getRecruiterReports.mockResolvedValue({ data: {
      funnel: [{ stage: "APPLIED", count: 100 }, { stage: "SHORTLISTED", count: 40 }],
      drives: [{ jobId: 5, title: "SDE", lifecycle: "PUBLISHED", funnel: [{ stage: "APPLIED", count: 100 }], offers: { awaiting: 2, accepted: 3, declined: 1, joined: 0 } }],
    } });
    render(<RecruiterCompanyPage />);
    expect(await screen.findByText(/40% of applied/)).toBeInTheDocument();
    const row = screen.getByText("SDE").closest("tr");
    expect(within(row).getByText("6")).toBeInTheDocument(); // 2 awaiting + 3 accepted + 1 declined
  });

  test("reports with no drives explain when they will appear", async () => {
    mockQuery = { tab: "reports" };
    getRecruiterReports.mockResolvedValue({ data: { funnel: [], drives: [] } });
    render(<RecruiterCompanyPage />);
    expect(await screen.findByText(/Reports appear once you have a drive/)).toBeInTheDocument();
  });
});

describe("Request a drive", () => {
  const request = { id: 9, roleTitle: "SDE", description: "Build", location: "Hyderabad", ctcLpa: 6, fixedLpa: 4, minCgpa: 6.5, maxActiveBacklogs: 1, driveMode: "OFF_CAMPUS", bondMonths: null, noteFromPlacementCell: "Give the CTC as a range" };

  test("a new request is sent to the placement cell and clears the draft", async () => {
    planDrive.mockResolvedValue({ data: { colleges: [{ collegeId: 7, jobId: 31 }] } });
    render(<RecruiterRequestDrivePage />);
    fireEvent.change(await screen.findByPlaceholderText("e.g. Software Engineer"), { target: { value: "Data Analyst" } });
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "7" } });
    fireEvent.click(screen.getByTestId("recruiter.plan-drive.send"));
    await waitFor(() => expect(planDrive).toHaveBeenCalled());
    expect(planDrive.mock.calls[0][0]).toMatchObject({ jobTitle: "Data Analyst", roleOptions: [{ ctcLpa: 7 }] });
    expect(await screen.findByText("Request sent")).toBeInTheDocument();
    expect(window.localStorage.getItem("recruiter-drive-draft:5:7")).toBeNull();
    // Leaving the page after sending must not write the sent request back as a draft.
    window.dispatchEvent(new Event("pagehide"));
    expect(window.localStorage.getItem("recruiter-drive-draft:5:7")).toBeNull();
  });

  test("the preview shows what students will see as you type", async () => {
    render(<RecruiterRequestDrivePage />);
    fireEvent.change(await screen.findByPlaceholderText("e.g. Software Engineer"), { target: { value: "QA Engineer" } });
    expect(await within(screen.getByTestId("recruiter.plan-drive.preview")).findByText("QA Engineer")).toBeInTheDocument();
  });

  test("opening the page and leaving it untouched saves no draft, so no restore banner ever appears for nothing", async () => {
    const view = render(<RecruiterRequestDrivePage />);
    await screen.findByPlaceholderText("e.g. Software Engineer");
    await new Promise((r) => setTimeout(r, 900)); // longer than the 600 ms autosave delay
    expect(window.localStorage.getItem("recruiter-drive-draft:5:7")).toBeNull();
    view.unmount();
    render(<RecruiterRequestDrivePage />);
    await screen.findByPlaceholderText("e.g. Software Engineer");
    expect(screen.queryByTestId("recruiter.plan-drive.restored")).not.toBeInTheDocument();
  });

  test("an unsent draft is restored with a way to start over", async () => {
    window.localStorage.setItem("recruiter-drive-draft:5:7", JSON.stringify({ values: { jobTitle: "Half written" } }));
    render(<RecruiterRequestDrivePage />);
    expect(await screen.findByDisplayValue("Half written")).toBeInTheDocument();
    expect(screen.getByTestId("recruiter.plan-drive.restored")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard draft" }, { timeout: 5000 }));
    await waitFor(() => expect(screen.queryByDisplayValue("Half written")).not.toBeInTheDocument());
    expect(window.localStorage.getItem("recruiter-drive-draft:5:7")).toBeNull();
  });

  test("another recruiter's unsent draft on the same computer is not restored", async () => {
    window.localStorage.setItem("recruiter-drive-draft:99:7", JSON.stringify({ values: { jobTitle: "Someone else's draft" } }));
    render(<RecruiterRequestDrivePage />);
    await screen.findByPlaceholderText("e.g. Software Engineer");
    expect(screen.queryByDisplayValue("Someone else's draft")).not.toBeInTheDocument();
    expect(screen.queryByTestId("recruiter.plan-drive.restored")).not.toBeInTheDocument();
  });

  test("nothing is sent back any more: an old fix-and-resend link opens the drive's Requests tab", async () => {
    mockQuery = { fix: "9" };
    listDriveRequests.mockResolvedValue({ data: [request] });
    render(<RecruiterRequestDrivePage />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/recruiter/drives/9?tab=messages"));
    expect(resubmitDriveRequest).not.toHaveBeenCalled();
  });

  test("hire again starts from the earlier drive as a brand-new request", async () => {
    mockQuery = { from: "9" };
    listDriveRequests.mockResolvedValue({ data: [request] });
    planDrive.mockResolvedValue({ data: { colleges: [{ collegeId: 7, jobId: 40 }] } });
    render(<RecruiterRequestDrivePage />);
    expect(await screen.findByDisplayValue("SDE")).toBeInTheDocument();
    expect(screen.queryByTestId("recruiter.plan-drive.note")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("recruiter.plan-drive.send"));
    await waitFor(() => expect(planDrive).toHaveBeenCalled());
    const sent = planDrive.mock.calls[0][0];
    expect(sent.jobTitle).toBe("SDE");
    expect(sent.roleOptions[0].fixedLpa).toBe(4); // the whole earlier request is copied, not just the title
    expect(sent.eligibility.maxActiveBacklogs).toBeUndefined(); // backlogs are gone: the LMS has no source for them
    expect(sent.driveMode).toBe("OFF_CAMPUS");
  });

  test("a drive that is not theirs looks like it does not exist", async () => {
    mockQuery = { from: "123" };
    listDriveRequests.mockResolvedValue({ data: [request] });
    render(<RecruiterRequestDrivePage />);
    expect(await screen.findByText("We could not find that drive")).toBeInTheDocument();
  });
});
