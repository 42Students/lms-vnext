/**
 * TPO UX batch 3: applicants can be filtered by the columns that matter, worked as a board (with the consequence shown before a move),
 * and reviewed one by one from the keyboard.
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ApplicantsTab from "@/components/tpo/drive/ApplicantsTab";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { bulkMoveApplicants, bulkRejectApplicants } from "@/api/Services/TpoService";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {}, pathname: "/tpo/drives/901", replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({
  applyOnBehalf: jest.fn(), bulkMoveApplicants: jest.fn((...a) => ({ call: "move", a })), bulkRejectApplicants: jest.fn((...a) => ({ call: "reject", a })),
  remindNotApplied: jest.fn(), undoBulkAction: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  bulkNudge: jest.fn(), getSavedViews: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }), saveView: jest.fn(), deleteView: jest.fn(),
}));

const job = { id: 901, companyName: "Acme" };
const applicants = [
  { applicationId: 1, learnerId: 1, firstName: "Asha", lastName: "Rao", rollNumber: "R001", branch: "CSE", cgpa: 8.5, marks: { UG: { shown: "8.5 CGPA", pct: 80.8, converted: true, verified: true } }, hasResume: true, stage: "APPLIED" },
  { applicationId: 2, learnerId: 2, firstName: "Bala", lastName: "K", rollNumber: "R002", branch: "ECE", cgpa: 6.2, marks: { UG: { shown: "6.2 CGPA", pct: 58.9, converted: true, verified: true } }, hasResume: false, stage: "APPLIED" },
  { applicationId: 3, learnerId: 3, firstName: "Chitra", lastName: "S", rollNumber: "R003", branch: "CSE", cgpa: 7.4, marks: { UG: { shown: "7.4 CGPA", pct: 70.3, converted: true, verified: true } }, hasResume: true, stage: "SHORTLISTED" },
];

const renderTab = (props = {}) => render(<ApplicantsTab job={job} applicants={applicants} notApplied={[]} reload={jest.fn()} onOpenStudent={jest.fn()} onShare={jest.fn()} {...props} />);

beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockResolvedValue({ success: true, data: { undoGroupId: "g1", moved: 1, skipped: [] } }); // the server says how many it really moved
});

// Full tab with the grid (loaded on its own) and antd Selects: the default 5s is tight on a loaded machine.
jest.setTimeout(30000);

test("the UG % filter in the side panel hides the students below it, and the chip clears it", async () => {
  renderTab();
  expect(await screen.findByText("Bala K")).toBeInTheDocument(); // the grid loads on its own
  fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
  // Marks are in the Academics section of the panel (sections other than the first start closed).
  // Wait for the panel to open its first section, then open Academics (clicking earlier is undone as the panel opens).
  await waitFor(() => expect(screen.getByRole("button", { name: /In this drive/ })).toHaveAttribute("aria-expanded", "true"));
  fireEvent.click(screen.getByRole("button", { name: /Academics/ }));
  fireEvent.change(await screen.findByLabelText("UG % from"), { target: { value: "60" } });
  fireEvent.click(screen.getByTestId("filter.apply"));
  await waitFor(() => expect(screen.queryByText("Bala K")).not.toBeInTheDocument());
  expect(screen.getByText("Asha Rao")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(await screen.findByText("Bala K")).toBeInTheDocument();
});

test("the board puts each student in their stage's column and a move names who will be told", async () => {
  renderTab();
  fireEvent.click(screen.getByText("Board"));
  const applied = screen.getByLabelText("Applied, 2");
  expect(applied).toHaveTextContent("Asha Rao");
  expect(screen.getByLabelText("Shortlisted, 1")).toHaveTextContent("Chitra S");
  // keyboard route: the card's own "Move to" picker
  const picker = screen.getAllByLabelText("Move Asha Rao")[0];
  fireEvent.mouseDown(picker.closest(".ant-select").querySelector(".ant-select-selector"));
  fireEvent.click(await screen.findByText("Interview", { selector: ".ant-select-item-option-content" }));
  expect(await screen.findByText("Move Asha Rao to Interview?")).toBeInTheDocument();
  expect(screen.getByText("1 student will be moved to the interview stage and told.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Move" }));
  await waitFor(() => expect(bulkMoveApplicants).toHaveBeenCalledWith(901, [1], "INTERVIEW"));
});

/** Review one by one is an action in the Actions window: open it on everyone shown, pick Review, start with the first. */
const startReview = async () => {
  fireEvent.click(await screen.findByTestId("applicants.act"));
  fireEvent.click(await screen.findByTestId("applicant-actions.review"));
  expect(screen.getByTestId("applicant-actions.go")).toHaveTextContent("Review 3 applicants");
  fireEvent.click(screen.getByTestId("applicant-actions.go"));
};

test("review mode: S shortlists and moves to the next student, R marks not selected, Esc-free keyboard flow", async () => {
  renderTab();
  await startReview();
  expect(await screen.findByText("Asha Rao", { selector: "h4" })).toBeInTheDocument();
  await act(async () => { fireEvent.keyDown(window, { key: "s" }); });
  await waitFor(() => expect(bulkMoveApplicants).toHaveBeenCalledWith(901, [1], "SHORTLISTED"));
  expect(await screen.findByText("Bala K", { selector: "h4" })).toBeInTheDocument();
  await act(async () => { fireEvent.keyDown(window, { key: "r" }); });
  await waitFor(() => expect(bulkRejectApplicants).toHaveBeenCalledWith(901, [2], "Not selected by the company"));
  expect(await screen.findByText("Chitra S", { selector: "h4" })).toBeInTheDocument();
  expect(screen.getByText("2 of 3")).toBeInTheDocument();
});

test("typing in a box never triggers a review decision", async () => {
  renderTab();
  await startReview();
  await screen.findByText("Asha Rao", { selector: "h4" });
  const box = document.createElement("input");
  document.body.appendChild(box);
  box.focus();
  fireEvent.keyDown(box, { key: "s" });
  expect(bulkMoveApplicants).not.toHaveBeenCalled();
  box.remove();
});
