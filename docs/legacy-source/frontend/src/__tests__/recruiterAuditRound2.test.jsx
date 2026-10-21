/** Recruiter pages audit, round 2 (12 Oct 2026): the Drives list keeps its place, says what is next, and a request in review can be edited. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RecruiterDrivesPage from "@/pages/recruiter/drives/index";
import RecruiterRequestDrivePage from "@/pages/recruiter/drives/new";
import { getCollegeOverview, getRecruiterMe, listDriveRequests, listMyDrives, resubmitDriveRequest } from "@/api/Services/RecruiterService";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockQuery = {};
jest.setTimeout(30000);
jest.mock("next/router", () => ({ __esModule: true, default: { events: { on: jest.fn(), off: jest.fn() }, asPath: "/" }, useRouter: () => ({ push: mockPush, replace: mockReplace, query: mockQuery, isReady: true, pathname: "/recruiter/drives", asPath: "/recruiter/drives" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (sel) => sel({ loginUser: { userType: "RECRUITER", collegeId: 7 } }) }));
jest.mock("@/api/Services/RecruiterService", () => ({
  getRecruiterMe: jest.fn(), listMyDrives: jest.fn(), getCollegeOverview: jest.fn(), listDriveRequests: jest.fn(), planDrive: jest.fn(), resubmitDriveRequest: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {};
  window.localStorage.clear();
  getRecruiterMe.mockResolvedValue({ data: { scope: "COLLEGE", collegeId: 7, user: { id: 5, companyName: "Omega" } } });
  getCollegeOverview.mockResolvedValue({ data: { studentsTotal: 200 } });
});

test("opening the list on a tab keeps that tab: the address is not reset on the first load", async () => {
  mockQuery = { tab: "live" };
  listMyDrives.mockResolvedValue({ data: [{ id: 1, roleTitle: "Live role", lifecycle: "PUBLISHED", applicants: 3, offers: 0, liveShares: 1 }] });
  render(<RecruiterDrivesPage />);
  expect(await screen.findByText("Live role")).toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalledWith(expect.objectContaining({ query: expect.not.objectContaining({ tab: "live" }) }), undefined, expect.anything());
});

test("each drive says what is next, and an unsent draft can be picked up", async () => {
  window.localStorage.setItem("recruiter-drive-draft:5:7", JSON.stringify({ values: { jobTitle: "Analyst" }, rounds: [] }));
  mockQuery = { tab: "all" };
  listMyDrives.mockResolvedValue({ data: [{ id: 2, roleTitle: "In review", lifecycle: "REQUEST", applicants: 0, offers: 0 }] });
  render(<RecruiterDrivesPage />);
  expect(await screen.findByText(/Next: The placement cell reviews it and sets the dates/)).toBeInTheDocument();
  expect(screen.getByTestId("recruiter.drives.draft")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(mockPush).toHaveBeenCalledWith("/recruiter/drives/new");
});

test("a request still in review is edited in place and saved as a new version", async () => {
  mockQuery = { edit: "9" };
  listDriveRequests.mockResolvedValue({ data: [{ id: 9, roleTitle: "SDE", canResubmit: true, ctcLpa: 6, driveMode: "ON_CAMPUS", jobType: "Full-time" }] });
  resubmitDriveRequest.mockResolvedValue({ data: {} });
  render(<RecruiterRequestDrivePage />);
  expect(await screen.findByText("Edit your request")).toBeInTheDocument();
  expect(screen.getByDisplayValue("SDE")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Save changes" })[0]);
  await waitFor(() => expect(resubmitDriveRequest).toHaveBeenCalledWith(7, 9, expect.objectContaining({ jobTitle: "SDE" })));
  expect(mockPush).toHaveBeenCalledWith("/recruiter/drives/9");
});

test("a request no longer in review cannot be edited", async () => {
  mockQuery = { edit: "9" };
  listDriveRequests.mockResolvedValue({ data: [{ id: 9, roleTitle: "SDE", canResubmit: false }] });
  render(<RecruiterRequestDrivePage />);
  expect(await screen.findByText("We could not find that drive")).toBeInTheDocument();
});

test("access that ended says so and who can give it back, instead of a generic error", async () => {
  mockQuery = { tab: "all" };
  listMyDrives.mockRejectedValue({ response: { status: 403, data: { message: "No access to this college" } } });
  render(<RecruiterDrivesPage />);
  expect(await screen.findByText(/Your access to this college has ended or was removed/)).toBeInTheDocument();
});

test("a rich-text description from the placement cell becomes plain text when hiring again", () => {
  const { descriptionText } = require("@/pages/recruiter/drives/new");
  expect(descriptionText("&lt;p&gt;Build things&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Java&lt;/li&gt;&lt;/ul&gt;")).toBe("Build things\n\n• Java"); // a paragraph ends with a blank line, so editing keeps the paragraphs
  expect(descriptionText("Plain words")).toBe("Plain words");
});
