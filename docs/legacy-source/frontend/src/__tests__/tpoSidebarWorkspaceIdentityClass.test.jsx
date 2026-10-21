/**
 * UI/UX audit follow-up (SHELL-14): the TPO workspace gets a subtle, distinct visual identity
 * (denser cards, calmer than superadmin) via a body class toggled only while inside /tpo, so it
 * never touches any other role's screens.
 */
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Sidebar from "@/components/Sidebar/Sidebar";

jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: () => jest.fn() }));
jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getCounts: jest.fn(() => Promise.resolve({ data: { requests: 3, messages: 3, bell: 0 } })),
  getMyAccess: jest.fn().mockResolvedValue({ success: false }),
  getDriveDayMine: jest.fn().mockResolvedValue({ success: false }),
  getRequestsQueue: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }),
  getThreads: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }),
}));
jest.mock("@/api/Services/ProfileService", () => ({}));
jest.mock("@/utils/useCollegeFeatureFlags", () => () => ({ projectsEnabled: true, placementsEnabled: true, modules: [] }));
jest.mock("@/utils/navigationActiveKey", () => ({ getSidebarActiveKey: () => "home" }));

afterEach(() => {
  cleanup();
  document.body.classList.remove("tpo-workspace-active");
});

test("adds tpo-workspace-active to <body> while inside /tpo", async () => {
  useRouter.mockReturnValue({ pathname: "/tpo/home", isReady: true });
  useSelector.mockImplementation((sel) => sel({
    loginUser: { id: 1, userType: "FACULTY", facultyType: "TPO" },
    app: { activeMenuItem: "home", profilePercentage: null },
  }));
  render(<Sidebar />);
  expect(document.body.classList.contains("tpo-workspace-active")).toBe(true);
});

test("does not add the class for a learner outside /tpo", async () => {
  useRouter.mockReturnValue({ pathname: "/learn/courses", isReady: true });
  useSelector.mockImplementation((sel) => sel({
    loginUser: { id: 2, userType: "LEARNER" },
    app: { activeMenuItem: "courses", profilePercentage: null },
  }));
  render(<Sidebar />);
  expect(document.body.classList.contains("tpo-workspace-active")).toBe(false);
});
