/**
 * UI/UX audit follow-up:
 * - SHELL-05: TPO's 12 sidebar destinations get real section labels (Operate/Coordinate/
 *   Insights/Administration), not a bare divider line.
 * - SHELL-06: Profile is dropped from the TPO sidebar - the header's ProfileDropdown already
 *   covers it.
 * - SHELL-13: Requests and Messages show a small workload badge in the sidebar.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Sidebar from "@/components/Sidebar/Sidebar";
import { getRequestsQueue, getThreads } from "@/api/Services/TpoHubService";

jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: () => jest.fn() }));
jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getCounts: jest.fn(() => Promise.resolve({ data: { requests: 3, messages: 3, bell: 0 } })),
  getMyAccess: jest.fn().mockResolvedValue({ success: false }),
  getDriveDayMine: jest.fn().mockResolvedValue({ success: false }),
  getRequestsQueue: jest.fn(),
  getThreads: jest.fn(),
}));
jest.mock("@/api/Services/ProfileService", () => ({}));
jest.mock("@/utils/useCollegeFeatureFlags", () => () => ({ projectsEnabled: true, placementsEnabled: true, modules: [] }));
jest.mock("@/utils/navigationActiveKey", () => ({ getSidebarActiveKey: () => "home" }));

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ pathname: "/tpo/home", isReady: true });
  useSelector.mockImplementation((sel) => sel({
    loginUser: { id: 1, userType: "FACULTY", facultyType: "TPO", firstName: "Asha" },
    app: { activeMenuItem: "home", profilePercentage: null },
  }));
  getRequestsQueue.mockResolvedValue({ data: { status: "success", data: [{ id: 1 }, { id: 2 }, { id: 3 }] } });
  getThreads.mockResolvedValue({ data: { status: "success", data: [{ unread: 2 }, { unread: 1 }] } });
});

test("shows section headers instead of a bare divider (SHELL-05)", async () => {
  render(<Sidebar />);
  expect(await screen.findByText("Operate")).toBeInTheDocument();
  expect(screen.getByText("Coordinate")).toBeInTheDocument();
  expect(screen.getByText("Insights")).toBeInTheDocument();
  expect(screen.getByText("Administration")).toBeInTheDocument();
});

test("Profile is not a sidebar destination (SHELL-06) but Notifications still is", async () => {
  render(<Sidebar />);
  await screen.findByText("Operate");
  expect(screen.queryByTestId("sidebar-item-profile")).not.toBeInTheDocument();
  expect(screen.getByTestId("sidebar-item-notifications")).toBeInTheDocument();
});

test("Requests and Messages carry a workload badge (SHELL-13)", async () => {
  render(<Sidebar />);
  const requestsItem = await screen.findByTestId("sidebar-item-requests");
  expect(requestsItem).toHaveTextContent("3");
  const messagesItem = screen.getByTestId("sidebar-item-messages");
  expect(messagesItem).toHaveTextContent("3");
});
