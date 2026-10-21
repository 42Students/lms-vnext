/**
 * UI/UX audit (brutal recruiter pass, 2026-10-01): a handful of recruiter surfaces silently swallowed load
 * failures (indistinguishable from "nothing here"), one page ignored the college it was opened
 * from, and one edit form dropped every field but the role title.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import RecruiterPlanDrivePage from "@/pages/recruiter/drives/new";
import {
  createDriveRequest, getCollegeOverview, getRecruiterColleges, getRecruiterMe, getPendingInvites, listDriveRequests, listMyDrives,
} from "@/api/Services/RecruiterService";

jest.mock("next/router", () => ({ useRouter: () => ({ query: { college: "7" }, isReady: true, push: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/RecruiterService", () => ({
  listMyDrives: jest.fn(), getPendingInvites: jest.fn(), acceptPendingInvite: jest.fn(), declinePendingInvite: jest.fn(),
  getCollegeOverview: jest.fn(), listDriveRequests: jest.fn(), createDriveRequest: jest.fn(), resubmitDriveRequest: jest.fn(),
  getRecruiterColleges: jest.fn(), getRecruiterMe: jest.fn(), planDrive: jest.fn(),
}));

beforeEach(() => { jest.clearAllMocks(); });

describe("HrPlanDrivePage", () => {
  test("has no college picker: a drive is requested from the session's own college", async () => {
    getRecruiterMe.mockResolvedValue({ data: { scope: "COLLEGE", collegeId: 7, user: { companyName: "Acme" } } });
    getCollegeOverview.mockResolvedValue({ data: { studentsTotal: 200 } });
    render(<RecruiterPlanDrivePage />);
    expect((await screen.findAllByRole("button", { name: "Send for review" }))[0]).toBeInTheDocument();
    expect(screen.queryByText("4. Colleges")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search colleges")).not.toBeInTheDocument();
    expect(getRecruiterColleges).not.toHaveBeenCalled();
  });
});
