import React from "react";
import { render, screen } from "@testing-library/react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Sidebar from "@/components/Sidebar/Sidebar";
import { getSidebarActiveKey } from "@/utils/navigationActiveKey";
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
jest.mock("@/utils/useCollegeFeatureFlags", () => () => ({
  projectsEnabled: true,
  placementsEnabled: true,
  modules: [],
}));

beforeEach(() => {
  jest.clearAllMocks();
  getRequestsQueue.mockResolvedValue({ data: { status: "success", data: [] } });
  getThreads.mockResolvedValue({ data: { status: "success", data: [] } });
});

test("TPO uses normalized Ant icons so Requests cannot disappear on the white sidebar", async () => {
  useRouter.mockReturnValue({ pathname: "/tpo/requests", isReady: true });
  useSelector.mockImplementation((selector) => selector({
    loginUser: { id: 1, userType: "FACULTY", facultyType: "TPO" },
    app: { activeMenuItem: "requests", profilePercentage: null },
  }));

  render(<Sidebar />);

  const requests = await screen.findByTestId("sidebar-item-requests");
  expect(requests).toHaveClass("active");
  expect(requests.querySelector(".fl-module-link__ant-icon")).not.toBeNull();
  expect(requests.querySelector(".fl-module-link__icon img")).toBeNull();
  expect(screen.getByTestId("sidebar").querySelector(".tpo-sidebar-panel")).not.toBeNull();
});

test("HR uses the same normalized icon geometry and has no stray divider before Home", async () => {
  useRouter.mockReturnValue({ pathname: "/recruiter/company", isReady: true });
  useSelector.mockImplementation((selector) => selector({
    loginUser: { id: 7, userType: "RECRUITER" },
    app: { activeMenuItem: "company", profilePercentage: null },
  }));

  render(<Sidebar />);

  const company = await screen.findByTestId("sidebar-item-company");
  expect(company).toHaveClass("active");
  expect(company.querySelector(".fl-module-link__ant-icon")).not.toBeNull();
  expect(screen.getByTestId("sidebar").querySelector(".recruiter-sidebar-panel")).not.toBeNull();

  // learning -> account creates one divider; there must not be another divider above Home.
  expect(screen.getByTestId("sidebar").querySelectorAll(".fl-panel-module-list__divider")).toHaveLength(1);
});

test("Employer 360 resolves to the Leads sidebar destination", () => {
  expect(getSidebarActiveKey("/tpo/companies?name=Acme")).toBe("recruiters");
});

test("TPO and HR use a row-owned active state with no sliding indicator", async () => {
  useRouter.mockReturnValue({ pathname: "/recruiter/home", isReady: true });
  useSelector.mockImplementation((selector) => selector({
    loginUser: { id: 7, userType: "RECRUITER" },
    app: { activeMenuItem: "home", profilePercentage: null },
  }));

  render(<Sidebar />);
  const home = await screen.findByTestId("sidebar-item-home");
  expect(home).toHaveClass("active");
  expect(screen.getByTestId("sidebar").querySelector(".fl-panel-module-list__indicator")).toBeNull();
  expect(screen.getByTestId("sidebar-link-home")).toHaveAttribute("aria-label", "Today (current page)");
});

test("TPO Drive Day keeps Drives highlighted for TPO/admin users", async () => {
  useRouter.mockReturnValue({ pathname: "/tpo/drive-day/[roundId]", isReady: true });
  useSelector.mockImplementation((selector) => selector({
    loginUser: { id: 1, userType: "FACULTY", facultyType: "TPO" },
    app: { activeMenuItem: "home", profilePercentage: null },
  }));

  render(<Sidebar />);
  expect(await screen.findByTestId("sidebar-item-drives")).toHaveClass("active");
  expect(screen.getByTestId("sidebar-link-drives")).toHaveAttribute("aria-current", "page");
});

