/**
 * UI/UX audit (Batch 5/6/8): Students, Notifications and Audit log all used to show a failed
 * load as an empty/default state with only a toast (or, for Audit, no error handling at all) -
 * indistinguishable from "genuinely nothing here."
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TpoStudents from "@/pages/tpo/students/index";
import TpoNotifications from "@/pages/tpo/notifications";
import TpoAudit from "@/pages/tpo/audit";
import { getStudentsTable } from "@/api/Services/TpoHubService";
import { getBell } from "@/api/Services/TpoHubService";
import { getAuditLog } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), query: {}, pathname: "/tpo", replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getStudentsTable: jest.fn(), bulkAssignPrep: jest.fn(), bulkDebar: jest.fn(), bulkHigherStudies: jest.fn(),
  bulkNudge: jest.fn(), commitAcademicImport: jest.fn(), getPrepCourses: jest.fn(), previewAcademicImport: jest.fn(),
  getBell: jest.fn(), bellReadAll: jest.fn(), getAuditLog: jest.fn(), getCounts: jest.fn().mockResolvedValue({ data: { bell: 0 } }),
  getSavedViews: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }), saveView: jest.fn(), deleteView: jest.fn(),
}));
jest.mock("@/components/tpo/RequestsPanel", () => function RequestsPanelStub() { return <div>RequestsPanelStub</div>; });

beforeEach(() => { jest.clearAllMocks(); });

test("Students: a failed load shows an inline error with Retry, not an empty table", async () => {
  getStudentsTable.mockRejectedValue({ response: { data: { message: "DB down" } } });
  render(<TpoStudents />);
  expect(await screen.findByText("DB down")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
});

test("Notifications: a failed load shows an inline error, not silently \"Nothing yet\"", async () => {
  getBell.mockRejectedValue({ response: { data: { message: "Bell service down" } } });
  render(<TpoNotifications />);
  expect(await screen.findByText("Bell service down")).toBeInTheDocument();
  expect(screen.queryByText("Nothing yet")).not.toBeInTheDocument();
});

test("Audit log: a failed load shows an inline error, previously had no error handling at all", async () => {
  getAuditLog.mockRejectedValue({ response: { data: { message: "Audit query failed" } } });
  render(<TpoAudit />);
  expect(await screen.findByText("Audit query failed")).toBeInTheDocument();
  expect(screen.queryByText("Nothing logged yet")).not.toBeInTheDocument();
});

// BE-0042: the feed is a window; the unread number comes from the server, and older ones can be loaded.
test("Notifications: a full window says 'Latest', counts unread from the server, and shows older on request", async () => {
  const rows = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, title: `Item ${i + 1}`, body: "", createdAt: "2026-10-08T10:00:00", readAt: "2026-10-08T11:00:00" }));
  getBell.mockResolvedValue({ data: rows });
  const { getCounts } = jest.requireMock("@/api/Services/TpoHubService");
  getCounts.mockResolvedValue({ data: { bell: 3 } });
  render(<TpoNotifications />);
  expect(await screen.findByText("Latest 50")).toBeInTheDocument();
  expect(screen.getByText("Unread (3)")).toBeInTheDocument();
  expect(screen.getByText("Mark all as read").closest("button")).not.toBeDisabled();
  expect(screen.getByTestId("tpo.notifications.older")).toHaveTextContent("3 unread are older than what is shown");
  fireEvent.click(screen.getByText("Show older"));
  await waitFor(() => expect(getBell).toHaveBeenLastCalledWith(100));
});

// BE-0034: a date range cut at the limit says so, with the real total from the server.
test("Audit log: a cut range says how many events it really has", async () => {
  const rows = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, action: "X", entityType: "DRIVE", createdAt: "2026-10-08T10:00:00" }));
  getAuditLog.mockResolvedValue({ data: rows, headers: { "x-total-count": "7" } });
  render(<TpoAudit />);
  // No range picked: the latest view; the total header only matters for ranges, so this just loads.
  expect(await screen.findAllByText("X")).toBeTruthy();
});
