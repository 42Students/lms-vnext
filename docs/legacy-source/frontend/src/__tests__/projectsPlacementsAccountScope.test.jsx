import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { accountScopeKey } from "@/utils/accountScopeKey";
import LearnProjectsPage from "@/pages/learn/projects";
import MentorProjectsPage from "@/pages/mentor/projects";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";

let mockSession;
const mockRouter = { pathname: "/learn/my-placements/jobs", query: {}, push: jest.fn() };

jest.mock("react-redux", () => ({ useSelector: (selector) => selector({ loginUser: mockSession }) }));
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/components/Projects/ProjectsContent", () => {
  const React = require("react");
  return function MockProjectsContent() {
    const [value, setValue] = React.useState(0);
    return <button onClick={() => setValue((v) => v + 1)}>Projects state {value}</button>;
  };
});
jest.mock("@/utils/useCollegeFeatureFlags", () => ({
  __esModule: true,
  default: () => ({ projectsEnabled: true, modules: { projects: true } }),
}));
jest.mock("@/common/lists", () => ({ placementsTabList: [
  { key: "1", label: "Overview", path: "" },
  { key: "2", label: "Jobs", path: "jobs" },
  { key: "3", label: "Applications", path: "applications" },
] }));
jest.mock("@/layouts/placementsTheme", () => ({}));
// The layout asks how many announcements are new; unmocked, that request outlived the test and the in-band image build
// exited 1 although every test passed (13 Oct 2026).
jest.mock("@/api/Services/TpoHubService", () => ({ getStudentAnnouncementsUnread: jest.fn(() => Promise.resolve({ data: { unread: 0 } })) }));
jest.mock("@/hooks/useSwipeNav", () => ({ useSwipeNav: () => ({ current: null }) }));
jest.mock("@/components/Common/PageShell", () => {
  const React = require("react");
  return function MockPageShell({ children }) { return React.createElement("main", null, children); };
});

function PlacementProbe() {
  const [value, setValue] = useState(0);
  return <button onClick={() => setValue((v) => v + 1)}>Placements state {value}</button>;
}
function LayoutHarness() { return PlacementsTabsLayout(<PlacementProbe />); }

beforeEach(() => {
  mockSession = { id: 42, userType: "LEARNER", collegeId: 7, organizationId: 3 };
  mockRouter.pathname = "/learn/my-placements/jobs";
  mockRouter.push.mockClear();
});

it("distinguishes identical numeric user IDs in different colleges and organizations", () => {
  const old = accountScopeKey(mockSession);
  expect(accountScopeKey({ ...mockSession, collegeId: 8 })).not.toBe(old);
  expect(accountScopeKey({ ...mockSession, organizationId: 4 })).not.toBe(old);
  expect(accountScopeKey({ ...mockSession, userType: "FACULTY", facultyType: "MENTOR" })).not.toBe(old);
  expect(accountScopeKey(null)).toBe("anonymous");
});

it("remounts learner Projects when the active college switches", () => {
  const view = render(<LearnProjectsPage />);
  fireEvent.click(screen.getByRole("button", { name: "Projects state 0" }));
  expect(screen.getByRole("button", { name: "Projects state 1" })).toBeInTheDocument();
  mockSession = { ...mockSession, collegeId: 8 };
  view.rerender(<LearnProjectsPage />);
  expect(screen.getByRole("button", { name: "Projects state 0" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Projects state 1" })).not.toBeInTheDocument();
});

it("remounts mentor Projects for an account switch", () => {
  mockSession = { id: 11, userType: "FACULTY", facultyType: "MENTOR", collegeId: 7, organizationId: 3 };
  const view = render(<MentorProjectsPage />);
  fireEvent.click(screen.getByRole("button", { name: "Projects state 0" }));
  mockSession = { ...mockSession, id: 12 };
  view.rerender(<MentorProjectsPage />);
  expect(screen.getByRole("button", { name: "Projects state 0" })).toBeInTheDocument();
});

it("remounts every Placements tab subtree when tenant or role switches", () => {
  const view = render(<LayoutHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Placements state 0" }));
  mockSession = { ...mockSession, organizationId: 4 };
  view.rerender(<LayoutHarness />);
  expect(screen.getByRole("button", { name: "Placements state 0" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Placements state 0" }));
  mockSession = { ...mockSession, userType: "FACULTY" };
  view.rerender(<LayoutHarness />);
  expect(screen.getByRole("button", { name: "Placements state 0" })).toBeInTheDocument();
});

it("does not discard a Placements page for a harmless Redux object refresh", () => {
  const view = render(<LayoutHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Placements state 0" }));
  mockSession = { ...mockSession };
  view.rerender(<LayoutHarness />);
  expect(screen.getByRole("button", { name: "Placements state 1" })).toBeInTheDocument();
});
