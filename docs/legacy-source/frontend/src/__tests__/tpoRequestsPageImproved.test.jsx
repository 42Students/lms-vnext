/** Requests page: urgent first, type chips, drive filter, student context, history, and the one-student mode for the panel. */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Modal } from "antd";
import dayjs from "dayjs";
import RequestsPanel, { isUrgent, sortRequests } from "@/components/tpo/RequestsPanel";
import { getRequestsQueue } from "@/api/Services/TpoHubService";

// Full pages on the AG Grid; under a loaded machine the default 5s is flaky.
jest.setTimeout(30000);

let mockQuery = {};
jest.mock("next/router", () => ({ useRouter: () => ({ query: mockQuery, pathname: "/tpo/requests", push: jest.fn(), replace: jest.fn() }) }));
beforeEach(() => { mockQuery = {}; });
jest.mock("@/api/Services/TpoHubService", () => ({
  getRequestsQueue: jest.fn(),
  getSavedViews: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }), saveView: jest.fn(), deleteView: jest.fn(),
}));
jest.mock("@/api/Services/TpoService", () => ({ decideRequest: jest.fn() }));
afterEach(() => Modal.destroyAll());

const soon = dayjs().add(5, "hour").format("YYYY-MM-DDTHH:mm:ss");
const later = dayjs().add(5, "day").format("YYYY-MM-DDTHH:mm:ss");
const rows = [
  { id: 1, type: "REGISTRATION_CHANGE", status: "PENDING", learnerId: 11, firstName: "Asha", rollNumber: "R1", branch: "CSE", registration: "PLACEMENTS", placed: 0, createdAt: "2026-10-01T09:00:00", payload: { choice: "HIGHER_STUDIES" } },
  { id: 2, type: "WITHDRAWAL", status: "PENDING", learnerId: 12, firstName: "Bala", rollNumber: "R2", branch: "ECE", registration: "PLACEMENTS", placed: 1, jobId: 5, drive: "Zoho · CRM", nextRoundAt: soon, nextRoundName: "Interview", createdAt: "2026-10-02T09:00:00" },
  { id: 3, type: "WITHDRAWAL", status: "PENDING", learnerId: 13, firstName: "Chitra", rollNumber: "R3", branch: "CSE", registration: "PLACEMENTS", placed: 0, jobId: 6, drive: "Wipro · QA", nextRoundAt: later, nextRoundName: "Test", createdAt: "2026-09-30T09:00:00" },
];

beforeEach(() => {
  jest.clearAllMocks();
  getRequestsQueue.mockResolvedValue({ data: rows });
});

test("a round within 24 hours makes a request urgent, and urgent ones sort first", () => {
  expect(isUrgent(rows[1])).toBe(true);
  expect(isUrgent(rows[2])).toBe(false);
  expect(sortRequests(rows).map((r) => r.id)).toEqual([2, 3, 1]);
});

test("rows show the student's context and the round time", async () => {
  render(<RequestsPanel />);
  expect(await screen.findByText("Already placed")).toBeInTheDocument();
  expect(screen.getByText(/Interview (today|tomorrow)/)).toBeInTheDocument(); // 5 hours ahead is tomorrow after 7 pm
  expect(screen.getByText("R2 · ECE · Looking for a job")).toBeInTheDocument();
});

test("the filter panel's request type (kept in the address) filters the rows", async () => {
  mockQuery = { f_type: "REGISTRATION_CHANGE" };
  render(<RequestsPanel />);
  expect(await screen.findByText("Asha")).toBeInTheDocument();
  expect(screen.queryByText("Bala")).not.toBeInTheDocument();
});

test("All history asks the server for every decided request", async () => {
  render(<RequestsPanel />);
  await screen.findByText("Asha");
  fireEvent.click(screen.getByText("All history"));
  await waitFor(() => expect(getRequestsQueue).toHaveBeenLastCalledWith(true, 0));
});

test("inside a student's panel it lists only that student, without the page's summary", async () => {
  render(<RequestsPanel learnerId={13} />);
  expect(await screen.findByText("Wipro · QA")).toBeInTheDocument();
  expect(screen.queryByText("Zoho · CRM")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Request summary")).not.toBeInTheDocument();
});
