/**
 * recruiter V2: one college per session. A college session shows that college's workspace and nothing
 * about the recruiter's other colleges. The college-less session (the chooser on the global domain)
 * lists the colleges to enter and pending invitations, and makes no dashboard calls at all.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RecruiterHome from "@/pages/recruiter/home";
import { getRecruiterMe } from "@/api/Services/RecruiterService";
import { switchToMembership } from "@/utils/switchMembership";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("react-redux", () => ({
  useSelector: (selector) => selector({ loginUser: { userType: "RECRUITER", firstName: "Rita" } }),
  useDispatch: () => jest.fn(),
}));
jest.mock("@/api/Services/RecruiterService", () => ({ getRecruiterMe: jest.fn() }));
jest.mock("@/utils/switchMembership", () => ({ switchToMembership: jest.fn() }));
jest.mock("@/components/recruiter/RecruiterToday", () => function TodayStub({ collegeId }) { return <div data-testid="today-stub">{`today for ${collegeId}`}</div>; });

const collegeMe = {
  scope: "COLLEGE",
  collegeId: 1,
  user: { firstName: "Rita", companyName: "Acme", collegeName: "Complete College" },
  colleges: [{ collegeId: 1, collegeName: "Complete College", membershipKey: "hr:1" }],
};
const hubMe = {
  scope: "GLOBAL",
  user: { firstName: "Rita", companyName: "Acme" },
  colleges: [
    { collegeId: 1, collegeName: "Complete College", membershipKey: "hr:1" },
    { collegeId: 2, collegeName: "Other College", membershipKey: "hr:2" },
  ],
  globalMembershipKey: "hr:global",
};

beforeEach(() => { jest.clearAllMocks(); });

test("a college session shows Today for its own college and never offers a way to other colleges", async () => {
  getRecruiterMe.mockResolvedValue({ data: collegeMe });
  render(<RecruiterHome />);
  expect(await screen.findByTestId("today-stub")).toHaveTextContent("today for 1");
  expect(screen.queryByText("Other College")).not.toBeInTheDocument();
  expect(screen.queryByText(/All my colleges/i)).not.toBeInTheDocument();
  expect(screen.queryByTestId("recruiter.home.back-to-global")).not.toBeInTheDocument();
  expect(screen.queryByText(/across colleges|your colleges|portfolio/i)).not.toBeInTheDocument();
});

test("a session without a college says to sign in on the college's own address, with no chooser", async () => {
  getRecruiterMe.mockResolvedValue({ data: hubMe });
  render(<RecruiterHome />);
  expect(await screen.findByTestId("recruiter.home.no-college")).toBeInTheDocument();
  expect(screen.getByText("Open this on your college's placement address")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Open" })).not.toBeInTheDocument();
});
