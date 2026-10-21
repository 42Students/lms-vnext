/** Night audit 13 Oct 2026: the drive page asks the same gate the server applies, and says what to do. */
import React from "react";
import { render, screen } from "@testing-library/react";
import JobDetailContent from "@/components/Placements/JobDetailContent";
import Api from "@/api/ApiMethod";
import { getApplyCheck } from "@/api/Services/TpoHubService";
import { getStudentDetails } from "@/api/Services/UserServices";
import { getLearnerApplications, getSavedJobIds } from "@/api/Services/jobService";

const mockRouter = { isReady: true, asPath: "/learn/my-placements/jobs/46", query: { jobId: "46" }, push: jest.fn() };
const mockSession = { id: 159, userType: "LEARNER", organizationId: 6, collegeId: 6 };

jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("react-redux", () => ({ useSelector: (selector) => selector({ loginUser: mockSession }) }));
jest.mock("@/api/ApiMethod", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getApplyCheck: jest.fn(), getDriveEligibility: jest.fn(() => Promise.resolve({ data: null })), getPlacementJourney: jest.fn(() => Promise.resolve({ data: { applications: [], schedule: [], offers: [] } })), getDriveProcess: jest.fn(() => Promise.resolve({ data: [] })), getPlacementRules: jest.fn(() => Promise.resolve({ data: { points: [{ title: "Offers you can hold", text: "One offer at a time." }] } })), getApplyChecks: jest.fn(() => Promise.resolve({ data: {} })), getPlacementOverview: jest.fn(() => Promise.resolve({ data: { registration: {}, offers: [], schedule: [], requests: [], debarments: [], notices: [] } })) }));
jest.mock("@/api/Services/UserServices", () => ({ getStudentDetails: jest.fn() }));
jest.mock("@/api/Services/jobService", () => ({
  applyToJob: jest.fn(), checkIfApplied: jest.fn(), withdrawApplication: jest.fn(),
  saveJob: jest.fn(), unsaveJob: jest.fn(), getSavedJobIds: jest.fn(),
  getLearnerApplications: jest.fn(), getApplicationById: jest.fn(),
}));
jest.mock("@/components/Placements/PlacementsCompanyAvatar", () => {
  const ReactLocal = require("react");
  return function MockAvatar() { return ReactLocal.createElement("span"); };
});

const job = { id: 46, jobTitle: "QA analyst", companyName: "Accenture", jobType: "Full-time", applicationDeadline: null };

beforeEach(() => {
  jest.clearAllMocks();
  getStudentDetails.mockResolvedValue({ data: { data: {} } });
  getLearnerApplications.mockResolvedValue({ data: { data: [] } });
  getSavedJobIds.mockResolvedValue({ data: { data: [] } });
  Api.get.mockImplementation((url) => {
    if (url.includes("/visibility/")) return Promise.resolve({ data: { status: "success", data: { job, isVisible: true } } });
    if (url.includes("/applied/")) return Promise.resolve({ data: { status: "success", data: { applied: false } } });
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
});

test("a student who must register first sees why and where to go, and cannot apply", async () => {
  getApplyCheck.mockResolvedValue({ data: { canApply: false, code: "REGISTER_FIRST", reason: "Register for placements first. It takes a minute, and then you can apply.", action: "REGISTER" } });
  render(<JobDetailContent basePath="/learn/my-placements" />);
  expect(await screen.findByText("Register for placements first. It takes a minute, and then you can apply.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Register in Placement cell" })).toBeInTheDocument();
  expect(screen.getByText("You can't apply to this drive")).toBeInTheDocument();
  screen.getAllByRole("button", { name: /apply/i }).filter((b) => /^apply/i.test(b.textContent.trim())).forEach((b) => expect(b).toBeDisabled());
});

test("a student who can apply is told so plainly", async () => {
  getApplyCheck.mockResolvedValue({ data: { canApply: true, code: "OPEN" } });
  render(<JobDetailContent basePath="/learn/my-placements" />);
  expect(await screen.findByText("You meet this drive's rules.")).toBeInTheDocument();
  expect(screen.getByText("You can apply")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Register in Placement cell" })).toBeNull();
});
