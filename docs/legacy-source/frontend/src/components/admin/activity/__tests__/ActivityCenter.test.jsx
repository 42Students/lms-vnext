import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ActivityCenter from "../ActivityCenter";
import { searchAuditLogs } from "@/api/Services/SuperAdminAuditService";

jest.mock("@/api/Services/SuperAdminAuditService", () => ({
  searchAuditLogs: jest.fn(),
}));
jest.mock("@/utils/csvExport", () => ({ exportRowsToCsv: jest.fn() }));
jest.mock("../activityText", () => ({
  describeActivity: () => ({ verb: "updated", thing: "course", sentence: "updated course", bulk: false }),
  activityName: () => "Structures",
  activityTone: () => "info",
  payloadDetails: () => [],
}));

const row = {
  id: 1,
  createdAt: new Date().toISOString(),
  actorUserType: "FACULTY",
  actorUserId: 10,
  actionKey: "COURSE_UPDATED",
};

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("initial activity load uses a list-shaped loading state", () => {
  const pending = deferred();
  searchAuditLogs.mockReturnValue(pending.promise);

  const { container } = render(<ActivityCenter collegeId={7} />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading activity");
  expect(container.querySelectorAll(".lms-skeleton-list__row")).toHaveLength(6);
});

test("manual refresh keeps the last feed visible and surfaces a failed refresh", async () => {
  searchAuditLogs.mockResolvedValueOnce({
    data: { items: [row], total: 1, actorNames: { "FACULTY:10": "Dr Rao" } },
  });

  render(<ActivityCenter collegeId={7} />);
  expect(await screen.findByText("Structures")).toBeInTheDocument();

  const refresh = deferred();
  searchAuditLogs.mockReturnValueOnce(refresh.promise);
  fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

  expect(screen.getByText("Structures")).toBeInTheDocument();
  expect(screen.getByText("Refreshing activity…")).toBeInTheDocument();

  await act(async () => { refresh.reject(new Error("offline")); });

  expect(await screen.findByText("Couldn't load activity")).toBeInTheDocument();
  expect(screen.getByText("Structures")).toBeInTheDocument();
});

test("changing the activity scope removes old rows while the new scope loads", async () => {
  searchAuditLogs.mockResolvedValueOnce({
    data: { items: [row], total: 1, actorNames: {} },
  });

  const nextScope = deferred();
  render(<ActivityCenter collegeId={7} />);
  expect(await screen.findByText("Structures")).toBeInTheDocument();

  searchAuditLogs.mockReturnValueOnce(nextScope.promise);
  fireEvent.click(screen.getByText("People & access"));

  expect(screen.queryByText("Structures")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Loading activity");

  await act(async () => {
    nextScope.resolve({ data: { items: [], total: 0, actorNames: {} } });
  });
  expect(await screen.findByText("No activity in this period.")).toBeInTheDocument();
});
