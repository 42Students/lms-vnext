/**
 * Students on the grid (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md, STUDENTS-ACTIONS-PLAN-2026-10-05.md): only students in
 * placements, a Batch selector at the top with finished batches last (their students hidden until picked), filters in the shared
 * side panel (URL state), no stats strip, and every action from the Actions window over the view or the ticked rows.
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Modal } from "antd";
import TpoStudents from "@/pages/tpo/students/index";
import { getStudentsTable } from "@/api/Services/TpoHubService";
import { batchesOf } from "@/components/tpo/students/studentGridRules";

jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockQuery = {};
jest.mock("next/router", () => ({ useRouter: () => ({ query: mockQuery, pathname: "/tpo/students", replace: mockReplace, push: mockPush }) }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getStudentsTable: jest.fn(), bulkAssignPrep: jest.fn(), bulkDebar: jest.fn(), bulkHigherStudies: jest.fn(), bulkNudge: jest.fn(),
  commitAcademicImport: jest.fn(), getPrepCourses: jest.fn(), previewAcademicImport: jest.fn(),
  getSavedViews: jest.fn(() => Promise.resolve({ data: [] })), saveView: jest.fn(), deleteView: jest.fn(),
}));
jest.mock("@/components/tpo/ImportPreviewModal", () => function ImportPreviewModalStub() { return null; });
jest.mock("@/components/tpo/StudentPanel", () => function StudentPanelStub({ learnerId }) { return <div data-testid="panel">Panel {learnerId}</div>; });
jest.mock("@/components/tpo/AddToDriveModal", () => function AddToDriveStub({ open, selected }) { return open ? <div data-testid="add-to-drive">{selected.length} to add</div> : null; });
// The grid stands in as a list: it honours the side-panel predicate (externalFilter) like the real grid does.
jest.mock("next/dynamic", () => () => {
  const React = require("react");
  return function GridStub({ rows, columns, externalFilter, onSelection, onShownChange, handle, context }) {
    const shown = rows.filter((r) => !externalFilter || externalFilter(r));
    const key = shown.map((r) => r.learnerId).join(",");
    React.useEffect(() => { onShownChange?.(shown); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
    React.useImperativeHandle(handle, () => ({ clearSelection: () => onSelection([]), shownRows: () => shown, columns: () => [], selectWhere: () => 0 }));
    const Name = columns[0].cellRenderer;
    const Batch = columns.find((c) => c.field === "batchName").cellRenderer;
    return (
      <div data-testid="grid-stub">
        <span>Rows: {shown.length}</span>
        {shown.map((r) => (
          <div key={r.learnerId} data-testid={`row-${r.learnerId}`}>
            <input type="checkbox" aria-label={`Select ${r.firstName}`} onChange={() => onSelection([r])} />
            <Name data={r} context={context} /> · {r.stage} · <Batch data={r} />
          </div>
        ))}
      </div>
    );
  };
});

const S = (id, over) => ({ learnerId: id, firstName: `S${id}`, branch: "CSE", status: "REGISTERED", stage: "REGISTERED", applications: 0, offers: 0,
  batchId: 21, batchName: "B.Tech CSE 2023-27", eligibility: "ELIGIBLE", ...over });
const load = (students) => getStudentsTable.mockResolvedValue({ data: { students, counts: {} } });

beforeEach(() => { jest.clearAllMocks(); mockQuery = {}; });
afterEach(() => Modal.destroyAll());

test("nobody in placements yet: the page says so and leads to Batches", async () => {
  load([]);
  render(<TpoStudents />);
  expect(await screen.findByTestId("students.empty")).toHaveTextContent("Nobody is in placements yet");
  fireEvent.click(screen.getByRole("button", { name: "Open Placement eligibility" }));
  expect(mockPush).toHaveBeenCalledWith("/tpo/batches");
});

test("finished batches are hidden by default, listed last in the Batch selector", async () => {
  const rows = [S(1), S(2, { stage: "PLACED", status: "PLACED" }), S(3, { batchId: 9, batchName: "B.Tech CSE 2022-26", batchFinished: true })];
  load(rows);
  render(<TpoStudents />);
  expect(await screen.findByText("Rows: 2")).toBeInTheDocument();
  expect(screen.getByTestId("students.batch-select")).toBeInTheDocument();
  expect(batchesOf(rows).map((b) => [b.name, b.finished, b.count])).toEqual([["B.Tech CSE 2023-27", false, 2], ["B.Tech CSE 2022-26", true, 1]]);
});

test("a finished batch picked in the URL shows its students, tagged", async () => {
  mockQuery = { f_batch: "9" };
  load([S(1), S(3, { batchId: 9, batchName: "B.Tech CSE 2022-26", batchFinished: true })]);
  render(<TpoStudents />);
  expect(await screen.findByText("Rows: 1")).toBeInTheDocument();
  expect(screen.getByText("From B.Tech CSE 2022-26")).toBeInTheDocument();
});

test("students whose batch was never invited: a banner that says they cannot register yet and points to Batches", async () => {
  load([S(1, { status: "NOT_REGISTERED", stage: "INVITED" }), S(2, { status: "NOT_REGISTERED", stage: "ELIGIBLE" }), S(3)]);
  render(<TpoStudents />);
  expect(await screen.findByTestId("students.nobody-registered")).toHaveTextContent("Registration is not open for 1 student: their batch has not been invited, so they cannot register.");
});

test("no stats strip or branch panel: the page goes straight to the list", async () => {
  load([S(1, { applications: 2 }), S(2), S(3, { stage: "PLACED", status: "PLACED" })]);
  render(<TpoStudents />);
  expect(await screen.findByText("Rows: 3")).toBeInTheDocument();
  expect(screen.queryByLabelText("Student numbers")).not.toBeInTheDocument();
  expect(screen.queryByText("Placement by branch")).not.toBeInTheDocument();
});

test("the stage filter from the URL narrows the grid; the act bar follows", async () => {
  mockQuery = { f_stage: "PLACED" };
  load([S(1), S(2, { stage: "PLACED", status: "PLACED" })]);
  render(<TpoStudents />);
  expect(await screen.findByText("Rows: 1")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByTestId("students.act")).toHaveTextContent("Act on all 1"));
});

test("a name opens the student panel; a selection gets the bulk actions", async () => {
  load([S(1), S(2)]);
  render(<TpoStudents />);
  fireEvent.click(await screen.findByRole("button", { name: "S2" }));
  expect(screen.getByTestId("panel")).toHaveTextContent("Panel 2");
  fireEvent.click(screen.getByLabelText("Select S1"));
  await waitFor(() => expect(screen.getByTestId("students.act")).toHaveTextContent("Act on 1 selected"));
  fireEvent.click(screen.getByTestId("students.act"));
  fireEvent.click(await screen.findByTestId("student-actions.add"));
  fireEvent.click(screen.getByTestId("student-actions.review")); // "Choose the drive…"
  expect(await screen.findByTestId("add-to-drive")).toHaveTextContent("1 to add");
});
