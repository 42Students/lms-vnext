import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import JobTypesTab from "@/components/tpo/settings/JobTypesTab";
import OutcomeLabelsTab from "@/components/tpo/settings/OutcomeLabelsTab";
import { getJobTypes, getOutcomeLabels, saveJobTypes, saveOutcomeLabels } from "@/api/Services/TpoHubService";
import { studentFilterDefs } from "@/components/tpo/students/studentGridRules";
import { applyFilters } from "@/components/tpo/filters/filterModel";

jest.mock("@/api/Services/TpoHubService", () => ({
  getJobTypes: jest.fn(), saveJobTypes: jest.fn(), getOutcomeLabels: jest.fn(), saveOutcomeLabels: jest.fn(),
}));

jest.setTimeout(30000);
const ok = (data) => Promise.resolve({ data: { status: "success", data } });
const BUILTINS = [
  { id: null, name: "Full-time", builtin: true, countsAsPlaced: true, hidden: false, drives: 4 },
  { id: null, name: "Internship", builtin: true, countsAsPlaced: false, hidden: false, drives: 1 },
];

beforeEach(() => jest.clearAllMocks());

test("a college type needs a name and the counts-as-placed answer; the save sends the whole list", async () => {
  getJobTypes.mockReturnValue(ok(BUILTINS));
  saveJobTypes.mockImplementation((list) => ok(list.map((t) => ({ ...t, id: t.id || (t.builtin ? null : "new1"), drives: 0 }))));
  render(<JobTypesTab />);
  await screen.findByText("Full-time");
  expect(screen.queryByLabelText("Name of Full-time")).not.toBeInTheDocument(); // built-in: not renamable
  fireEvent.change(screen.getByLabelText("New job type"), { target: { value: "Part-time" } });
  const add = screen.getByRole("button", { name: /Add/ });
  expect(add).toBeDisabled(); // the answer is required
  fireEvent.click(within(screen.getByRole("radiogroup", { name: "New type counts as placed" })).getByText("No"));
  fireEvent.click(add);
  expect(screen.getByLabelText("Name of Part-time")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(saveJobTypes).toHaveBeenCalled());
  expect(saveJobTypes.mock.calls[0][0]).toEqual(expect.arrayContaining([
    { id: null, name: "Part-time", builtin: false, countsAsPlaced: false, hidden: false },
    { id: null, name: "Internship", builtin: true, countsAsPlaced: false, hidden: false },
  ]));
});

test("a duplicate name is refused, and a type with drives cannot be removed", async () => {
  getJobTypes.mockReturnValue(ok([...BUILTINS, { id: "c1", name: "Part-time", builtin: false, countsAsPlaced: false, hidden: false, drives: 2 }]));
  render(<JobTypesTab />);
  await screen.findByLabelText("Name of Part-time");
  fireEvent.change(screen.getByLabelText("New job type"), { target: { value: "internship" } });
  expect(screen.getByText('"internship" is already a job type')).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove Part-time" })).toBeDisabled();
});

test("changing the answer of a type that has drives asks first", async () => {
  getJobTypes.mockReturnValue(ok([...BUILTINS, { id: "c1", name: "Part-time", builtin: false, countsAsPlaced: false, hidden: false, drives: 2 }]));
  saveJobTypes.mockImplementation((list) => ok(list));
  render(<JobTypesTab />);
  await screen.findByLabelText("Name of Part-time");
  fireEvent.click(within(screen.getByRole("radiogroup", { name: "Part-time counts as placed" })).getByText("Yes"));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("Change what counts as placed?")).toBeInTheDocument();
  expect(screen.getByText(/offers from its 2 drives will now count as placed/)).toBeInTheDocument();
  expect(saveJobTypes).not.toHaveBeenCalled();
});

test("outcome labels: shows the fixed list, refuses a fixed name, saves a label under its outcome", async () => {
  getOutcomeLabels.mockReturnValue(ok([]));
  saveOutcomeLabels.mockImplementation((list) => ok(list.map((l, i) => ({ ...l, id: l.id || `l${i}` }))));
  render(<OutcomeLabelsTab />);
  expect(await screen.findByText("Competitive exams")).toBeInTheDocument();
  expect(screen.getByText("Placed (on campus)")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("New label"), { target: { value: "Higher studies" } });
  expect(screen.getByText("That is already one of the fixed choices")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("New label"), { target: { value: "Family business" } });
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "New label counts as" }));
  fireEvent.click(await screen.findByTitle("Entrepreneurship / self-employed"));
  fireEvent.click(screen.getByRole("button", { name: /Add/ }));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(saveOutcomeLabels).toHaveBeenCalledWith([{ id: null, label: "Family business", outcome: "ENTREPRENEURSHIP" }]));
});

test("the Students Outcome filter uses the fixed outcomes", () => {
  const rows = [{ learnerId: 1, outcome: "COMPETITIVE_EXAMS" }, { learnerId: 2, outcome: "PLACED_ON_CAMPUS" }, { learnerId: 3 }];
  const defs = studentFilterDefs(rows);
  expect(applyFilters(rows, defs, { outcome: ["COMPETITIVE_EXAMS"] }).map((r) => r.learnerId)).toEqual([1]);
  expect(applyFilters(rows, defs, { outcome: ["NOT_REGISTERED"] }).map((r) => r.learnerId)).toEqual([3]);
});

test("renaming a type that drives use says the drives change too, before saving", async () => {
  getJobTypes.mockReturnValue(ok([...BUILTINS, { id: "c1", name: "Part-time", builtin: false, countsAsPlaced: false, hidden: false, drives: 3 }]));
  saveJobTypes.mockImplementation((list) => ok(list));
  render(<JobTypesTab />);
  fireEvent.change(await screen.findByLabelText("Name of Part-time"), { target: { value: "Part time" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("Rename on drives too?")).toBeInTheDocument();
  expect(screen.getByText('"Part-time" becomes "Part time" on its 3 drives, where students see it.')).toBeInTheDocument();
  expect(saveJobTypes).not.toHaveBeenCalled();
});
