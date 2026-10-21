/**
 * The student panel says what the Students page says (detail.row): marks as counted there, the standard After college outcome
 * with the college's label only on hover, real offers only; changing After college keeps the college label; notes say who wrote
 * them; lifting a debarment asks first.
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StudentPanel from "@/components/tpo/StudentPanel";
import { getStudentDetail, registerStudent } from "@/api/Services/TpoHubService";
import { liftDebarment } from "@/api/Services/TpoService";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children }) => <a href={href}>{children}</a> }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getStudentDetail: jest.fn(() => "detail"), registerStudent: jest.fn(() => "register"), addStudentNote: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ liftDebarment: jest.fn(() => "lift") }));
jest.mock("@/components/tpo/RequestsPanel", () => function RequestsPanel() { return null; });
jest.mock("@/hooks/useChoices", () => () => ({ outcomeLabels: [{ id: "a", label: "Startup", outcome: "ENTREPRENEURSHIP" }] }));

jest.setTimeout(30000);

const detail = {
  profile: { learnerId: 7, firstName: "Asha", lastName: "Rao", rollNumber: "R001", branch: "CSE", email: "asha@x.edu", phone: "9000000001", resumeUrl: "https://r/1.pdf", codingProfiles: [] },
  row: {
    learnerId: 7, stage: "REGISTERED", status: "ENTREPRENEURSHIP", registration: "ENTREPRENEURSHIP", outcome: "ENTREPRENEURSHIP",
    outcomeName: "Entrepreneurship / self-employed", outcomeLabel: "Startup", outcomeDetail: "Textile unit",
    applications: 3, offers: 1, profileStatus: "VERIFIED", readinessNote: "Ready", batchName: "2022-26",
    marks: { UG: { shown: "8.2 CGPA", pct: 77.9, converted: true, verified: true }, "10TH": { shown: "90%", pct: 90, verified: false } },
  },
  applications: [{ applicationId: 1, jobId: 41, companyName: "Acme", jobTitle: "SDE", stage: "OFFERED", offerStatus: "RELEASED", ctcLpa: 6 }],
  notes: [{ id: 1, note: "Strong in DSA", createdByName: "Tina Officer", createdAt: "2026-10-05T10:00:00" }],
  history: [], prep: [], requests: [],
  debarments: [{ id: 9, reason: "No-show twice", untilDrives: 2 }],
};

beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation(async (call) => (call === "detail" ? { success: true, data: detail } : { success: true, data: {} }));
});

test("shows the page's facts: standard outcome (label on hover), real offers, marks, profile check", async () => {
  render(<StudentPanel learnerId={7} onClose={jest.fn()} />);
  expect(await screen.findByText("Asha Rao · R001")).toBeInTheDocument();
  expect(screen.getByTestId("student-panel.offers")).toHaveTextContent("1");
  expect(screen.getAllByText("Entrepreneurship / self-employed").length).toBeGreaterThan(0);
  expect(screen.getByText("Startup: Textile unit")).toBeInTheDocument(); // under the choice, not in place of it
  expect(screen.getByText(/77\.9%/)).toBeInTheDocument();
  expect(screen.getByText("Verified", { selector: "strong" })).toBeInTheDocument();
  expect(screen.queryByText("Placement 360")).not.toBeInTheDocument();
});

test("changing After college keeps the college's label and asks what exactly", async () => {
  render(<StudentPanel learnerId={7} onClose={jest.fn()} />);
  await screen.findByText("Asha Rao · R001");
  const select = screen.getByTestId("student-panel.after-college").querySelector(".ant-select-selector");
  fireEvent.mouseDown(select);
  fireEvent.click(await screen.findByText("Competitive exams"));
  fireEvent.change(await screen.findByLabelText("Outcome detail"), { target: { value: "GATE 2027" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Save" })); });
  await waitFor(() => expect(registerStudent).toHaveBeenCalledWith(7, "COMPETITIVE_EXAMS", null, "GATE 2027"));
});

test("notes say who wrote them; lifting a debarment asks first", async () => {
  render(<StudentPanel learnerId={7} onClose={jest.fn()} />);
  await screen.findByText("Asha Rao · R001");
  fireEvent.click(screen.getByRole("tab", { name: /Notes/ }));
  expect(await screen.findByText(/Tina Officer/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /^Placement/ }));
  // Offered at the top (Needs attention) and in the Debarments list: either asks first.
  fireEvent.click((await screen.findAllByRole("button", { name: "Lift" }))[0]);
  expect(liftDebarment).not.toHaveBeenCalled();
  expect(await screen.findByText("Lift this debarment?")).toBeInTheDocument();
});

test("what needs doing comes first, and History is built from the record when nothing was logged", async () => {
  fetchWithErrorHandling.mockImplementation(async (call) => (call === "detail" ? { success: true, data: {
    ...detail,
    row: { ...detail.row, eligibility: "ELIGIBLE", eligibilityLevel: "BATCH", eligibilityBy: "Tina Officer", eligibilityAt: "2026-10-01T09:00:00",
      waitingSections: ["EDUCATION"], offersWaiting: 1, readiness: "NOT_READY", readinessNote: "No resume", programName: "B.Tech CSE", className: "CSE - A" },
    applications: [{ ...detail.applications[0], appliedAt: "2026-10-02T09:00:00", stageChangedAt: "2026-10-04T09:00:00" }],
    registration: [{ choice: "PLACEMENTS", source: "SELF", consentAt: "2026-10-01T10:00:00" }],
    requests: [{ id: 3, status: "PENDING" }],
  } } : { success: true, data: {} }));
  render(<StudentPanel learnerId={7} onClose={jest.fn()} />);
  await screen.findByText("Asha Rao · R001");
  // The branch is part of the program's name: said once.
  expect(screen.getByText("B.Tech CSE · CSE - A · 2022-26")).toBeInTheDocument();
  expect(screen.getByTestId("student-panel.eligibility")).toHaveTextContent("Eligible (from batch)");
  // Every fact is labelled, so "Eligible" (placements) is never confused with the Eligible stage.
  expect(screen.getByTestId("student-panel.status")).toHaveTextContent(/Stage.*Placements.*After college/);
  const attention = screen.getByTestId("student-panel.attention");
  expect(attention).toHaveTextContent("Debarred for 2 drives: No-show twice");
  expect(attention).toHaveTextContent("1 request waiting for your decision");
  expect(attention).toHaveTextContent("Education waiting for you to verify");
  expect(attention).toHaveTextContent("1 offer is waiting for their answer");
  fireEvent.click(screen.getByRole("button", { name: "Decide" }));
  expect(screen.getByRole("tab", { name: /Requests \(1 waiting\)/ })).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("tab", { name: "History" }));
  expect(await screen.findByText("Offered in a drive")).toBeInTheDocument();
  expect(screen.getByText("Applied to a drive")).toBeInTheDocument();
  expect(screen.getByText("Registered for placements")).toBeInTheDocument();
  expect(screen.getByText("Eligible for placements (from batch)")).toBeInTheDocument();
});
