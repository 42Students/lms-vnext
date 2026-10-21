/**
 * A recruiter cannot drop a college themselves: access is managed by the college (TPO) or the super admin.
 * The profile lists the colleges they can work with and says who to ask, with no leave button.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import RecruiterProfile from "@/pages/recruiter/profile";
import * as RecruiterService from "@/api/Services/RecruiterService";

jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (sel) => sel({ loginUser: { userType: "RECRUITER", collegeId: 6 } }) }));
jest.mock("@/api/Services/RecruiterService", () => ({ getRecruiterMe: jest.fn(), updateRecruiterMe: jest.fn() }));

test("the profile lists college access with no way for the recruiter to leave it", async () => {
  RecruiterService.getRecruiterMe.mockResolvedValue({ data: { scope: "COLLEGE", collegeId: 6, user: { firstName: "Priya", lastName: "Nair" }, colleges: [{ collegeId: 6, collegeName: "NSRIT" }] } });
  render(<RecruiterProfile />);
  expect(await screen.findByText("NSRIT")).toBeInTheDocument();
  expect(screen.getByText(/Your access is managed by the college/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Leave/i })).not.toBeInTheDocument();
  expect(RecruiterService.leaveCollege).toBeUndefined();
});
