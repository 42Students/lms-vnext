import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import useBulkAction, { eachLimited, planBulk } from "../BulkAction";
import { recordBulk } from "@/api/Services/TpoHubService";

jest.mock("@/api/Services/TpoHubService", () => ({ recordBulk: jest.fn(() => Promise.resolve({ data: { status: "success", data: {} } })) }));

const rows = [{ id: 1, name: "Asha" }, { id: 2, name: "Bala", placed: true }, { id: 3, name: "Chitra" }];
const ok = (data = {}) => ({ success: true, data });

let start;
function Harness() {
  const [s, el] = useBulkAction();
  start = s;
  return el;
}

beforeEach(() => jest.clearAllMocks());

test("planBulk splits the picked rows and groups the skipped ones by reason", () => {
  const plan = planBulk(rows, (r) => (r.placed ? "Already placed" : null));
  expect(plan.apply.map((r) => r.id)).toEqual([1, 3]);
  expect(plan.skipped).toEqual([{ reason: "Already placed", rows: [rows[1]] }]);
});

test("eachLimited keeps going when one row fails", async () => {
  const out = await eachLimited(rows, async (r) => { if (r.id === 2) throw new Error("boom"); return ok(); }, 2);
  expect(out.map((o) => o.ok)).toEqual([true, false, true]);
});

test("preview names who it applies to and who is skipped; nothing runs until confirmed; the run is recorded", async () => {
  const run = jest.fn(() => Promise.resolve(ok()));
  const onDone = jest.fn();
  render(<Harness />);
  act(() => start({ title: "Mark higher studies", noun: ["student", "students"], items: rows, nameOf: (r) => r.name, skip: (r) => (r.placed ? "Already placed" : null), run, onDone }));
  const preview = screen.getByTestId("bulk.preview");
  expect(within(preview).getByText("Asha, Chitra")).toBeInTheDocument();
  expect(within(screen.getByTestId("bulk.skipped")).getByText(/Already placed/)).toBeInTheDocument();
  expect(screen.getByText("This cannot be undone from here.")).toBeInTheDocument();
  expect(run).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("bulk.confirm"));
  await screen.findByText("Done for 2 students.");
  expect(run).toHaveBeenCalledWith([rows[0], rows[2]]);
  expect(onDone).toHaveBeenCalled();
  expect(recordBulk).toHaveBeenCalledWith({ action: "Mark higher studies", total: 3, done: 2, skipped: 1, failed: 0, undone: false });
});

test("partial failures of a whole-set call are listed with their reasons; undo gets only the rows that were done", async () => {
  const undo = jest.fn(() => Promise.resolve(ok()));
  render(<Harness />);
  act(() => start({
    title: "Verify and release", noun: ["offer", "offers"], items: [rows[0], rows[2]], nameOf: (r) => r.name,
    run: () => Promise.resolve(ok({ failed: [{ id: 3, reason: "Letter missing" }] })),
    partial: (res, items) => res.data.failed.map((f) => ({ item: items.find((r) => r.id === f.id), reason: f.reason })),
    undo,
  }));
  fireEvent.click(screen.getByTestId("bulk.confirm"));
  expect(await screen.findByText("Done for 1 offer.")).toBeInTheDocument();
  expect(screen.getByText("Chitra: Letter missing")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("bulk.undo"));
  await waitFor(() => expect(undo).toHaveBeenCalledWith([rows[0]], expect.anything()));
  expect(await screen.findByText("Undone for 1 offer.")).toBeInTheDocument();
  expect(screen.queryByTestId("bulk.undo")).not.toBeInTheDocument();
});

test("one call per row: a failed row does not stop the others", async () => {
  const runEach = jest.fn((r) => Promise.resolve(r.id === 1 ? { success: false, data: { message: "Already decided" } } : ok()));
  render(<Harness />);
  act(() => start({ title: "Approve", noun: ["request", "requests"], items: [rows[0], rows[2]], nameOf: (r) => r.name, runEach }));
  fireEvent.click(screen.getByTestId("bulk.confirm"));
  expect(await screen.findByText("Done for 1 request.")).toBeInTheDocument();
  expect(screen.getByText("Asha: Already decided")).toBeInTheDocument();
  expect(runEach).toHaveBeenCalledTimes(2);
});

test("when every picked row is skipped there is nothing to confirm", () => {
  render(<Harness />);
  act(() => start({ title: "Debar", items: [rows[1]], nameOf: (r) => r.name, skip: () => "Already debarred", run: jest.fn() }));
  expect(screen.getByTestId("bulk.confirm")).toBeDisabled();
  expect(screen.getByText(/None of the 1 row you picked/)).toBeInTheDocument();
});


test("retry failed reruns only failed rows and merges newly successful rows into the result", async () => {
  const runEach = jest.fn()
    .mockImplementationOnce((r) => Promise.resolve(r.id === 1 ? { success: false, data: { message: "Temporary failure" } } : ok()))
    .mockImplementationOnce(() => Promise.resolve(ok()));
  const onDone = jest.fn();

  render(<Harness />);
  act(() => start({
    title: "Approve",
    noun: ["request", "requests"],
    items: [rows[0], rows[2]],
    nameOf: (r) => r.name,
    runEach,
    onDone,
  }));

  fireEvent.click(screen.getByTestId("bulk.confirm"));
  expect(await screen.findByText("Asha: Temporary failure")).toBeInTheDocument();
  expect(screen.getByTestId("bulk.retry-failed")).toHaveTextContent("Retry failed (1)");

  fireEvent.click(screen.getByTestId("bulk.retry-failed"));

  await waitFor(() => expect(runEach).toHaveBeenCalledTimes(3));
  await waitFor(() => expect(screen.queryByText("Asha: Temporary failure")).not.toBeInTheDocument());
  expect(screen.getByText("Done for 2 requests.")).toBeInTheDocument();
  expect(onDone).toHaveBeenCalledTimes(2);
  expect(recordBulk).toHaveBeenLastCalledWith({
    action: "Approve retry",
    total: 1,
    done: 1,
    skipped: 0,
    failed: 0,
    undone: false,
  });
});

test("retry failed keeps unresolved failures visible instead of replaying successful rows", async () => {
  const runEach = jest.fn((r) => Promise.resolve(r.id === 1 ? { success: false, data: { message: "Still blocked" } } : ok()));

  render(<Harness />);
  act(() => start({
    title: "Approve",
    noun: ["request", "requests"],
    items: [rows[0], rows[2]],
    nameOf: (r) => r.name,
    runEach,
  }));

  fireEvent.click(screen.getByTestId("bulk.confirm"));
  expect(await screen.findByText("Asha: Still blocked")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("bulk.retry-failed"));

  await waitFor(() => expect(runEach).toHaveBeenCalledTimes(3));
  expect(screen.getByText("Done for 1 request.")).toBeInTheDocument();
  expect(screen.getByText("Asha: Still blocked")).toBeInTheDocument();
});

test("a serious action with no undo shows a red warning and runs only after the box is ticked", async () => {
  const run = jest.fn(() => Promise.resolve(ok()));
  render(<Harness />);
  act(() => start({ title: "Close drives", noun: ["drive", "drives"], items: [rows[0]], nameOf: (r) => r.name, danger: true, consequence: "Open applicants are told.", run }));
  expect(within(screen.getByTestId("bulk.danger")).getByText("This is a serious action for 1 drive")).toBeInTheDocument();
  expect(screen.getByText("Open applicants are told.")).toBeInTheDocument();
  const confirm = screen.getByTestId("bulk.confirm");
  expect(confirm).toBeDisabled();
  fireEvent.click(screen.getByText("I understand this cannot be undone."));
  expect(confirm).not.toBeDisabled();
  fireEvent.click(confirm);
  await screen.findByText("Done for 1 drive.");
  expect(run).toHaveBeenCalled();
});

test("a serious action with an undo warns but needs no tick; an action's own tick text gates it even when not serious", () => {
  render(<Harness />);
  act(() => start({ title: "Not selected", noun: ["applicant", "applicants"], items: [rows[0]], nameOf: (r) => r.name, danger: true, run: jest.fn(), undo: jest.fn() }));
  expect(screen.getByTestId("bulk.danger")).toBeInTheDocument();
  expect(screen.queryByTestId("bulk.ack")).toBeNull();
  expect(screen.getByTestId("bulk.confirm")).not.toBeDisabled();
  fireEvent.click(screen.getByText("Cancel"));
  act(() => start({ title: "Verify", noun: ["check", "checks"], items: [rows[0]], nameOf: (r) => r.name, ack: "I have checked their documents another way.", run: jest.fn() }));
  expect(screen.queryByTestId("bulk.danger")).toBeNull();
  expect(screen.getByTestId("bulk.confirm")).toBeDisabled();
  fireEvent.click(screen.getByText("I have checked their documents another way."));
  expect(screen.getByTestId("bulk.confirm")).not.toBeDisabled();
});
