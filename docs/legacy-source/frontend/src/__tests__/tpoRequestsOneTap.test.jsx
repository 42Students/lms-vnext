/**
 * TPO UX batch 1: a routine request is one tap. Approve needs no typing; reject asks for a reason
 * with chips; selected requests can be approved together.
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Modal } from "antd";
import RequestsPanel from "@/components/tpo/RequestsPanel";
import { getRequestsQueue } from "@/api/Services/TpoHubService";
import { decideRequest } from "@/api/Services/TpoService";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {}, pathname: "/tpo/requests", push: jest.fn(), replace: jest.fn() }) }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getRequestsQueue: jest.fn(),
  getSavedViews: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }), saveView: jest.fn(), deleteView: jest.fn(),
}));
jest.mock("@/api/Services/TpoService", () => ({ decideRequest: jest.fn() }));

const rows = [
  { id: 1, type: "WITHDRAWAL", status: "PENDING", firstName: "Asha", lastName: "Rao", rollNumber: "R1", drive: "Acme", reason: "Got another offer", createdAt: "2026-10-01T10:00:00" },
  { id: 2, type: "CORRECTION", status: "PENDING", firstName: "Bala", lastName: "K", rollNumber: "R2", drive: "Acme", reason: "CGPA wrong", createdAt: "2026-10-01T11:00:00" },
];

afterEach(() => Modal.destroyAll());

beforeEach(() => {
  jest.clearAllMocks();
  getRequestsQueue.mockResolvedValue({ data: { status: "success", data: rows } });
  decideRequest.mockResolvedValue({ data: { status: "success", data: {} } });
});

// A full page on the AG Grid; under a loaded machine (the whole suite in parallel) the default 5 s is flaky.
jest.setTimeout(30000);

test("a routine approve is one tap and sends no typed reason", async () => {
  render(<RequestsPanel />);
  const approve = await screen.findAllByRole("button", { name: "Approve" });
  fireEvent.click(approve[1]); // the correction
  await waitFor(() => expect(decideRequest).toHaveBeenCalledWith(2, true, "Approved by the placement cell"));
});

test("approving a withdrawal says what it does first", async () => {
  render(<RequestsPanel />);
  const approve = await screen.findAllByRole("button", { name: "Approve" });
  fireEvent.click(approve[0]);
  expect(await screen.findByText(/Asha Rao leaves Acme\. Their application is withdrawn\./)).toBeInTheDocument();
  expect(decideRequest).not.toHaveBeenCalled();
});

test("what the student sent is shown next to the reason", async () => {
  getRequestsQueue.mockResolvedValue({ data: { status: "success", data: [
    { id: 3, type: "EXTERNAL_OFFER", status: "PENDING", firstName: "Chitra", lastName: "S", rollNumber: "R3", reason: "Joined off campus", createdAt: "2026-10-01T11:00:00",
      payload: JSON.stringify({ companyName: "Globex", ctcLpa: 6.5, letterUrl: "https://x/letter.pdf" }) },
    { id: 4, type: "CORRECTION", status: "PENDING", firstName: "Dev", lastName: "M", rollNumber: "R4", reason: "Wrong CGPA", createdAt: "2026-10-01T11:00:00", payload: { field: "CGPA" } },
  ] } });
  render(<RequestsPanel />);
  expect(await screen.findByText("Globex")).toBeInTheDocument();
  expect(screen.getByText(/6.5 LPA/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Offer letter" })).toHaveAttribute("href", "https://x/letter.pdf");
  expect(screen.getByText("No proof attached")).toBeInTheDocument();
});

test("reject offers reason chips; a chip is enough to send", async () => {
  render(<RequestsPanel />);
  const reject = await screen.findAllByRole("button", { name: "Reject" });
  fireEvent.click(reject[1]);
  const dialog = await screen.findByRole("dialog");
  const ok = within(dialog).getAllByRole("button", { name: "Reject" }).pop();
  expect(ok).toBeDisabled();
  fireEvent.click(within(dialog).getByText("Proof missing or unclear"));
  expect(ok).not.toBeDisabled();
  fireEvent.click(ok);
  await waitFor(() => expect(decideRequest).toHaveBeenCalledWith(2, false, "Proof missing or unclear"));
});

test("Needs doing replaces the hero: the work is links that filter", async () => {
  render(<RequestsPanel />);
  expect(await screen.findByTestId("requests.work")).toBeInTheDocument();
  expect(screen.queryByText("Every exception has an owner, reason and outcome")).not.toBeInTheDocument();
});


test("routine approve is locked while pending and exposes retry after failure", async () => {
  let rejectFirst;
  const first = new Promise((_, reject) => { rejectFirst = reject; });
  decideRequest
    .mockReturnValueOnce(first)
    .mockResolvedValueOnce({ data: { status: "success", data: {} } });

  render(<RequestsPanel />);
  const approve = await screen.findAllByRole("button", { name: "Approve" });
  fireEvent.click(approve[1]);

  expect(approve[1]).toBeDisabled();
  fireEvent.click(approve[1]);
  expect(decideRequest).toHaveBeenCalledTimes(1);

  rejectFirst(new Error("decision service unavailable"));

  expect(await screen.findByText("The request decision was not saved")).toBeInTheDocument();
  expect(screen.getByText("decision service unavailable")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(decideRequest).toHaveBeenCalledTimes(2));
});

test("reject dialog stays open and locked while the decision is pending", async () => {
  let resolveDecision;
  const pending = new Promise((resolve) => { resolveDecision = resolve; });
  decideRequest.mockReturnValueOnce(pending);

  render(<RequestsPanel />);
  const reject = await screen.findAllByRole("button", { name: "Reject" });
  fireEvent.click(reject[1]);

  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByText("Proof missing or unclear"));
  const ok = within(dialog).getAllByRole("button", { name: "Reject" }).pop();
  fireEvent.click(ok);

  expect(decideRequest).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  resolveDecision({ data: { status: "success", data: {} } });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
