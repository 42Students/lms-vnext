import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import StudentGroupDetail from "../StudentGroupDetail";
import StudentGroupsList from "../StudentGroupsList";
import { getGroup, listGroups } from "@/api/Services/StudentGroupService";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/api/Services/StudentGroupService", () => ({
  MEMBER_STATES: [],
  STATUS_TRANSITIONS: {},
  GROUP_STATUSES: [],
  getGroup: jest.fn(),
  listGroups: jest.fn(),
  errorMessage: (e, fallback) => fallback || e?.message || "Request failed",
  addMembers: jest.fn(),
  applyRule: jest.fn(),
  clearRule: jest.fn(),
  getEvents: jest.fn(),
  getMembers: jest.fn(),
  getRule: jest.fn(),
  lockMember: jest.fn(),
  previewRule: jest.fn(),
  reconcileGroup: jest.fn(),
  removeMember: jest.fn(),
  setGroupStatus: jest.fn(),
  setRule: jest.fn(),
  updateGroup: jest.fn(),
  createGroup: jest.fn(),
  deleteGroup: jest.fn(),
}));
jest.mock("../StudentGroupForm", () => {
  const Component = () => <div />;
  return { __esModule: true, default: Component, groupToFormValues: () => ({}), toGroupBody: () => ({}) };
});
jest.mock("../groupUi", () => ({
  SOURCE_LABEL: {},
  StateTag: () => null,
  StatusTag: () => null,
  fmt: (v) => String(v || ""),
  seatsText: () => "0 members",
  statusLabel: (v) => v || "",
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("group detail load failure becomes a persistent retry state instead of a permanent spinner", async () => {
  getGroup.mockRejectedValue(new Error("offline"));

  render(<StudentGroupDetail id={7} />);

  expect(await screen.findByText("Could not load the group")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
});

test("student-groups list load failure is not rendered as the genuine empty state", async () => {
  listGroups.mockRejectedValue(new Error("offline"));

  render(<StudentGroupsList />);

  expect(await screen.findByText("Could not load groups")).toBeInTheDocument();
  expect(screen.queryByText(/No generic student groups yet/)).not.toBeInTheDocument();
});

test("student-groups initial load uses the shared table skeleton", () => {
  listGroups.mockReturnValue(new Promise(() => {}));

  const { container } = render(<StudentGroupsList />);

  expect(screen.getByText("Loading student groups").closest("[role=status]")).toHaveAttribute("aria-busy", "true");
  expect(container.querySelectorAll(".lms-skeleton-table__row")).toHaveLength(9);
});
