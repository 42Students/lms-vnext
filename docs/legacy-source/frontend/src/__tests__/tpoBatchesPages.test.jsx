/**
 * Batches and eligibility (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md): the Batches cards with their one next step, and the
 * Batch page where the TPO decides for the batch, a class or a selection of students (one reason for Ineligible, Undo after).
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Modal, message } from "antd";
import TpoBatches from "@/pages/tpo/batches/index";
import TpoBatch from "@/pages/tpo/batches/[batchId]";
import {
  decideEligibility, getBatch, getBatchStudents, getBatches, inviteBatch, remindBatch, undoEligibility, updateBatch,
} from "@/api/Services/BatchesService";
import { getStudentsTable } from "@/api/Services/TpoHubService";

jest.setTimeout(30000);
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockQuery = {};
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, query: mockQuery, pathname: "/tpo/batches/[batchId]" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/BatchesService", () => ({
  getBatches: jest.fn(), getBatch: jest.fn(), getBatchStudents: jest.fn(), updateBatch: jest.fn(), decideEligibility: jest.fn(),
  getLastEligibilityAction: jest.fn(), undoEligibility: jest.fn(), previewEligibilityImport: jest.fn(), commitEligibilityImport: jest.fn(),
  inviteBatch: jest.fn(), remindBatch: jest.fn(),
}));
// The Students-page rows that enrich the roster (stage, phone, resume) for the placed warning.
jest.mock("@/api/Services/TpoHubService", () => ({ ...jest.requireActual("@/api/Services/TpoHubService"), getStudentsTable: jest.fn() }));
// The grid is AG Grid in the browser; here a plain list with checkboxes stands in for it (same props, same handle).
jest.mock("next/dynamic", () => () => {
  const React = require("react");
  return function GridStub({ rows, onSelection, handle }) {
    const [picked, setPicked] = React.useState([]);
    React.useImperativeHandle(handle, () => ({
      clearSelection: () => { setPicked([]); onSelection([]); },
      selectWhere: () => 0, exportCsv: jest.fn(), columns: () => [], shownRows: () => rows,
    }));
    return (
      <ul data-testid="grid-stub">
        {rows.map((r) => (
          <li key={r.learnerId}>
            <label>
              <input type="checkbox" aria-label={`Select ${r.name}`} checked={picked.includes(r.learnerId)}
                onChange={(e) => {
                  const next = e.target.checked ? [...picked, r.learnerId] : picked.filter((x) => x !== r.learnerId);
                  setPicked(next); onSelection(rows.filter((x) => next.includes(x.learnerId)));
                }} />
              {r.name} · {r.eligibility}
            </label>
          </li>
        ))}
      </ul>
    );
  };
});

const BATCHES = {
  batches: [
    { batchId: 21, name: "B.Tech CSE 2023-27", department: "CSE", program: "B.Tech", startDate: "2023-08-01", endDate: "2027-06-30",
      students: 4, eligible: 0, ineligible: 0, notDecided: 4, invited: 0, registered: 0, verified: 0, placed: 0, state: "NOT_STARTED" },
    { batchId: 22, name: "B.Tech ECE 2022-26", department: "ECE", program: "B.Tech", endDate: "2026-06-30",
      students: 60, eligible: 50, ineligible: 10, notDecided: 0, invited: 50, invitedAt: "2025-07-01", registered: 50, verified: 40, placed: 20, state: "IN_PLACEMENTS" },
    { batchId: 9, name: "B.Tech CSE 2021-25", department: "CSE", program: "B.Tech", endDate: "2025-06-30",
      students: 70, eligible: 70, ineligible: 0, notDecided: 0, placed: 60, state: "FINISHED", finishedAt: "2025-07-01" },
  ],
  outsideBatches: { students: 3 },
  lastAction: { actionId: "a-1", changes: 2, actorName: "Ravi" },
};
const BATCH = {
  batchId: 21, name: "B.Tech CSE 2023-27", department: "CSE", program: "B.Tech", state: "NOT_STARTED",
  students: 4, eligible: 0, ineligible: 0, notDecided: 4, invited: 0, registered: 0, verified: 0, placed: 0, decision: null,
  classes: [
    { classId: 31, name: "CSE-A", students: 2, eligible: 0, ineligible: 0, notDecided: 2, decision: null },
    { classId: 32, name: "CSE-B", students: 2, eligible: 0, ineligible: 0, notDecided: 2, decision: null },
  ],
  history: [{ scopeType: "CLASS", scopeName: "CSE-B", beforeStatus: null, afterStatus: "INELIGIBLE", reason: "Year back", actorName: "Ravi", at: "2026-10-04T10:00:00" }],
  lastAction: null,
};
const STUDENTS = [
  { learnerId: 1, name: "Asha", rollNumber: "R1", classId: 31, className: "CSE-A", eligibility: "NOT_DECIDED" },
  { learnerId: 2, name: "Bala", rollNumber: "R2", classId: 31, className: "CSE-A", eligibility: "NOT_DECIDED" },
  { learnerId: 3, name: "Chitra", rollNumber: "R3", classId: 32, className: "CSE-B", eligibility: "NOT_DECIDED" },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {};
  getBatches.mockResolvedValue({ data: BATCHES });
  getBatch.mockResolvedValue({ data: BATCH });
  getBatchStudents.mockResolvedValue({ data: STUDENTS });
  getStudentsTable.mockResolvedValue({ data: { students: STUDENTS.map((s) => ({ learnerId: s.learnerId, stage: "APPLYING" })) } });
  decideEligibility.mockResolvedValue({ data: { changed: 2, actionId: "act-9" } });
  undoEligibility.mockResolvedValue({ data: { undone: 2 } });
  updateBatch.mockResolvedValue({ data: BATCH });
});
afterEach(() => { Modal.destroyAll(); message.destroy(); });

describe("Batches", () => {
  test("cards show the decisions and the journey, with one next step; finished batches are hidden until asked for", async () => {
    render(<TpoBatches />);
    const cse = await screen.findByTestId("batch-card-21");
    expect(within(cse).getByText("Not started")).toBeInTheDocument();
    expect(within(cse).getByRole("button", { name: "Decide who is in placements" })).toBeInTheDocument();
    expect(within(screen.getByTestId("batch-card-22")).getByRole("button", { name: "Verify 10 profiles" })).toBeInTheDocument();
    expect(screen.queryByTestId("batch-card-9")).not.toBeInTheDocument();
    expect(screen.getByText(/1 older batch is hidden/)).toBeInTheDocument();
    expect(screen.getByText("3 students are not in any class")).toBeInTheDocument();

    fireEvent.click(within(cse).getByRole("button", { name: "Decide who is in placements" }));
    expect(mockPush).toHaveBeenCalledWith("/tpo/batches/21?tab=students");
    fireEvent.click(within(screen.getByTestId("batch-card-22")).getByRole("button", { name: "Verify 10 profiles" }));
    expect(mockPush).toHaveBeenCalledWith("/tpo/verification");
  });

  test("the last change can be undone from the Batches page", async () => {
    render(<TpoBatches />);
    expect(await screen.findByText("Last change: 2 decisions by Ravi")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    await waitFor(() => expect(undoEligibility).toHaveBeenCalledWith("a-1"));
    await waitFor(() => expect(getBatches).toHaveBeenCalledTimes(2));
  });

  test("finished batches come back with the State filter", async () => {
    mockQuery = { f_state: "FINISHED" };
    render(<TpoBatches />);
    expect(await screen.findByTestId("batch-card-9")).toBeInTheDocument();
    expect(screen.queryByTestId("batch-card-21")).not.toBeInTheDocument();
    expect(within(screen.getByTestId("batch-card-9")).getByRole("button", { name: "View batch" })).toBeInTheDocument();
  });
});

describe("Batch page", () => {
  test("missing placement details keep the roster visible but hold actions until Retry succeeds", async () => {
    getStudentsTable.mockRejectedValueOnce({ response: { data: { message: "Students table unavailable" } } });
    render(<TpoBatch />);

    expect(await screen.findByText("Some student placement details are unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Asha/)).toBeInTheDocument();
    // Read-only grid: no action bar, so no eligibility decision can start on incomplete rows.
    expect(screen.queryByTestId("batch.act")).not.toBeInTheDocument();
    expect(decideEligibility).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Retry details" }));
    expect(await screen.findByTestId("batch.act")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Some student placement details are unavailable")).not.toBeInTheDocument());
  });

  beforeEach(() => { mockQuery = { batchId: "21" }; });

  /** Tick students on the sheet and open the Actions window on them. */
  const actOn = async (...names) => {
    for (const n of names) fireEvent.click(await screen.findByLabelText(`Select ${n}`));
    await waitFor(() => expect(screen.getByTestId("batch.act")).toHaveTextContent(`Act on ${names.length} selected`));
    fireEvent.click(screen.getByTestId("batch.act"));
  };

  test("a selection is made eligible in one go, through a preview, with Undo after", async () => {
    render(<TpoBatch />);
    await actOn("Asha", "Bala");
    fireEvent.click(await screen.findByTestId("student-actions.eligible"));
    fireEvent.click(screen.getByTestId("student-actions.review"));
    fireEvent.click(await screen.findByTestId("bulk.confirm"));
    await waitFor(() => expect(decideEligibility).toHaveBeenCalledWith([
      { scopeType: "LEARNER", scopeId: 1, status: "ELIGIBLE", reason: undefined },
      { scopeType: "LEARNER", scopeId: 2, status: "ELIGIBLE", reason: undefined },
    ]));
    expect(await screen.findByTestId("bulk.summary")).toHaveTextContent("2 decisions changed.");
    fireEvent.click(screen.getByTestId("bulk.undo"));
    await waitFor(() => expect(undoEligibility).toHaveBeenCalledWith("act-9"));
  });

  test("Ineligible needs one reason, which covers the whole selection", async () => {
    render(<TpoBatch />);
    await actOn("Asha", "Chitra");
    fireEvent.click(await screen.findByTestId("student-actions.ineligible"));
    fireEvent.click(screen.getByTestId("student-actions.review"));
    expect(await screen.findByText("Pick or write the reason")).toBeInTheDocument();
    expect(decideEligibility).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Higher studies"));
    fireEvent.click(screen.getByTestId("student-actions.review"));
    fireEvent.click(await screen.findByTestId("bulk.confirm"));
    await waitFor(() => expect(decideEligibility).toHaveBeenCalledWith([
      { scopeType: "LEARNER", scopeId: 1, status: "INELIGIBLE", reason: "Higher studies" },
      { scopeType: "LEARNER", scopeId: 3, status: "INELIGIBLE", reason: "Higher studies" },
    ]));
  });

  test("the whole batch is decided from its own menu", async () => {
    render(<TpoBatch />);
    fireEvent.click(await screen.findByTestId("batch-decide"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Eligible" }));
    await waitFor(() => expect(decideEligibility).toHaveBeenCalledWith([{ scopeType: "BATCH", scopeId: 21, status: "ELIGIBLE" }]));
  });

  test("Who is in: a class is made ineligible with a reason; history lists who did what", async () => {
    const { unmount } = render(<TpoBatch />);
    const row = await screen.findByTestId("class-row-32");
    expect(row).toHaveTextContent("2 not decided");
    fireEvent.click(within(row).getByTestId("class-decide-32"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Ineligible…" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByText("Detained / year back"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark ineligible" }));
    await waitFor(() => expect(decideEligibility).toHaveBeenCalledWith([{ scopeType: "CLASS", scopeId: 32, status: "INELIGIBLE", reason: "Detained / year back" }]));
    unmount();

    mockQuery = { batchId: "21", tab: "history" };
    render(<TpoBatch />);
    await waitFor(() => expect(document.querySelector(".tpo-batch__history")).toBeTruthy());
    const history = document.querySelector(".tpo-batch__history");
    expect(within(history).getByText(/CSE-B/)).toBeInTheDocument();
    expect(within(history).getByText(/Year back/)).toBeInTheDocument();
  });

  test("marking a batch finished asks first and explains what it means", async () => {
    render(<TpoBatch />);
    fireEvent.click(await screen.findByRole("button", { name: "Mark finished" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("can't apply on their own");
    await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: "Mark finished" })); });
    await waitFor(() => expect(updateBatch).toHaveBeenCalledWith("21", { finished: true }));
  });

  test("Next step: invite the eligible students with a deadline, then remind the ones still to choose", async () => {
    getBatch.mockResolvedValue({ data: { ...BATCH, eligible: 3, notDecided: 1, registrationDeadline: "2099-01-10T23:59:00" } });
    inviteBatch.mockResolvedValue({ data: { invited: 3 } });
    const { unmount } = render(<TpoBatch />);
    const step = await screen.findByTestId("batch.next-step");
    expect(step).toHaveTextContent("Invite 3 eligible students to register");
    fireEvent.click(within(step).getByTestId("batch-invite"));
    await waitFor(() => expect(inviteBatch).toHaveBeenCalledWith("21", expect.stringMatching(/^2099-01-1\dT\d\d:\d\d:00$/))); // end of the day, in UTC
    unmount();

    getBatch.mockResolvedValue({ data: { ...BATCH, eligible: 3, registered: 1, invitedAt: "2098-12-01T10:00:00", registrationDeadline: "2099-01-10T23:59:00" } });
    remindBatch.mockResolvedValue({ data: { reminded: 2 } });
    render(<TpoBatch />);
    const open = await screen.findByTestId("batch.next-step");
    expect(open).toHaveTextContent("Registration is open until 10 Jan 2099");
    fireEvent.click(within(open).getByTestId("batch-remind"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Remind 2 students to register?");
    await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: "Send reminder" })); });
    await waitFor(() => expect(remindBatch).toHaveBeenCalledWith("21"));
  });
});
