/** Recruiter pages audit, round 1 (12 Oct 2026): identity, review invites, internships, and what a recruiter can see on a drive. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RecruiterProfile from "@/pages/recruiter/profile";
import RecruiterRequestDrivePage, { buildDriveForm } from "@/pages/recruiter/drives/new";
import { payLine, whoCanApply } from "@/components/recruiter/RecruiterDriveOverview";
import { driveNextAction } from "@/components/recruiter/recruiterRoutes";
import { getCollegeOverview, getRecruiterMe, planDrive, updateRecruiterMe } from "@/api/Services/RecruiterService";

jest.setTimeout(30000);
jest.mock("next/router", () => ({ __esModule: true, default: { events: { on: jest.fn(), off: jest.fn() }, asPath: "/" }, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), query: {}, isReady: true, pathname: "/recruiter/x" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (sel) => sel({ loginUser: { userType: "RECRUITER", collegeId: 7 } }) }));
jest.mock("@/api/Services/RecruiterService", () => ({
  getRecruiterMe: jest.fn(), updateRecruiterMe: jest.fn(), getCollegeOverview: jest.fn(), listDriveRequests: jest.fn(), planDrive: jest.fn(),
}));

const me = { data: { scope: "COLLEGE", collegeId: 7, user: { id: 5, firstName: "Kumar", contactMail: "kumar@omega.com", contactMobile: null, companyName: "Omega", collegeName: "NSRIT" },
  colleges: [{ collegeId: 7, collegeName: "NSRIT", validUntil: [2027, 3, 31, 0, 0, 0] }] } };

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  getRecruiterMe.mockResolvedValue(me);
  getCollegeOverview.mockResolvedValue({ data: { studentsTotal: 200 } });
});

test("the work email is shown, never edited; the mobile is optional and saved", async () => {
  updateRecruiterMe.mockResolvedValue({ data: { user: { ...me.data.user, contactMobile: "9876543210" } } });
  render(<RecruiterProfile />);
  const email = await screen.findByTestId("recruiter.profile.email");
  expect(email).toHaveTextContent("kumar@omega.com");
  expect(screen.queryByRole("textbox", { name: /email/i })).not.toBeInTheDocument();
  expect(screen.getByText("Access until 31 Mar 2027. The placement cell can extend it.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^Mobile/), { target: { value: "9876543210" } });
  fireEvent.click(screen.getByTestId("recruiter.profile.save"));
  await waitFor(() => expect(updateRecruiterMe).toHaveBeenCalled());
  const sent = updateRecruiterMe.mock.calls[0][0];
  expect(sent.contactMobile).toBe("9876543210");
  expect(sent.contactMail).toBeUndefined();
});

test("an internship asks for the stipend, and the request carries the job type", async () => {
  planDrive.mockResolvedValue({ data: { colleges: [{ collegeId: 7, jobId: 40, status: "DRAFT" }] } });
  render(<RecruiterRequestDrivePage />);
  fireEvent.change(await screen.findByLabelText("Role title"), { target: { value: "Data intern" } });
  fireEvent.mouseDown(screen.getByLabelText("Job type"));
  fireEvent.click((await screen.findAllByText("Internship")).pop());
  fireEvent.change(await screen.findByLabelText("Stipend per month (₹)"), { target: { value: "25000" } });
  fireEvent.click(screen.getByTestId("recruiter.plan-drive.send"));
  await waitFor(() => expect(planDrive).toHaveBeenCalled());
  const body = planDrive.mock.calls[0][0];
  expect(body.jobType).toBe("Internship");
  expect(body.roleOptions[0].stipendPerMonth).toBe(25000);
  // A trusted company's request is approved at once: the page says so instead of "sent for approval".
  expect(await screen.findByText("Drive approved")).toBeInTheDocument();
});

test("fixed and variable pay cannot add up to more than the CTC", async () => {
  render(<RecruiterRequestDrivePage />);
  fireEvent.change(await screen.findByLabelText("Role title"), { target: { value: "Engineer" } });
  fireEvent.change(screen.getByLabelText("CTC (LPA)"), { target: { value: "6" } });
  fireEvent.change(screen.getByLabelText("Fixed (optional)"), { target: { value: "5" } });
  fireEvent.change(screen.getByLabelText("Variable (optional)"), { target: { value: "2" } });
  fireEvent.click(screen.getByTestId("recruiter.plan-drive.send"));
  expect(await screen.findByText("Fixed and variable add up to more than the CTC")).toBeInTheDocument();
  expect(planDrive).not.toHaveBeenCalled();
});

test("a stipend is only sent for internships", () => {
  const v = { jobTitle: "Engineer", jobType: "Full-time", ctcLpa: 6, stipendPerMonth: 20000 };
  expect(buildDriveForm(v, []).roleOptions[0].stipendPerMonth).toBeUndefined();
});

test("the drive overview reads pay and who can apply the way students do", () => {
  expect(payLine({ ctcLpa: 6.5, fixedLpa: 5.5, variableLpa: 1 })).toBe("6.5 LPA (5.5 LPA fixed + 1 LPA variable)");
  expect(payLine({ stipendPerMonth: 25000, stipendMonths: 6 })).toBe("₹25,000 a month stipend for 6 months");
  expect(whoCanApply({ branches: ["CSE", "IT"], passingYears: [2027], minCgpa: 7 })).toBe("CSE, IT · passing 2027 · CGPA 7+");
  expect(whoCanApply({})).toBe("All branches");
});

test("a drive the placement cell posted for review asks the recruiter to check it", () => {
  expect(driveNextAction({ lifecycle: "DRAFT", reviewInvited: 1 })).toMatchObject({ label: "Ask for a change", kind: "requests" });
  expect(driveNextAction({ lifecycle: "DRAFT", reviewInvited: 0 }).label).toBeNull();
});
