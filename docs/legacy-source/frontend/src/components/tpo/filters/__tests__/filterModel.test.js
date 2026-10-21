import { activeCount, applyFilters, chipsFor, fromQuery, mergeQuery, optionCounts, removeChip, toQuery } from "../filterModel";

const defs = [
  { key: "branch", label: "Branch", type: "checklist", get: (r) => r.branch },
  { key: "skills", label: "Skills", type: "checklist", get: (r) => r.skills },
  { key: "cgpa", label: "CGPA", type: "range", get: (r) => r.cgpa },
  { key: "placed", label: "Placed", type: "yesno", get: (r) => r.placed },
];
const rows = [
  { id: 1, branch: "CSE", skills: ["Java", "SQL"], cgpa: 8.2, placed: true },
  { id: 2, branch: "CSE", skills: ["Python"], cgpa: 6.9, placed: false },
  { id: 3, branch: "ECE", skills: ["Java"], cgpa: 7.5, placed: false },
  { id: 4, branch: "ECE, IoT", skills: [], cgpa: null, placed: false },
];
const ids = (list) => list.map((r) => r.id);

test("filters combine: checklist (any of), list values, range and yes/no", () => {
  expect(ids(applyFilters(rows, defs, { branch: ["CSE"] }))).toEqual([1, 2]);
  expect(ids(applyFilters(rows, defs, { skills: ["Java"] }))).toEqual([1, 3]);
  expect(ids(applyFilters(rows, defs, { cgpa: { min: 7 } }))).toEqual([1, 3]);
  expect(ids(applyFilters(rows, defs, { cgpa: { max: 7 } }))).toEqual([2]);
  expect(ids(applyFilters(rows, defs, { placed: "no", branch: ["ECE"] }))).toEqual([3]);
  expect(ids(applyFilters(rows, defs, {}))).toEqual([1, 2, 3, 4]);
  expect(activeCount(defs, { branch: [], cgpa: { min: undefined } })).toBe(0);
});

test("option counts follow the other filters, not their own", () => {
  const state = { branch: ["CSE"], placed: "no" };
  const branch = optionCounts(rows, defs, state, defs[0]);
  expect(branch.find((o) => o.value === "CSE").count).toBe(1); // only placed=no CSE
  expect(branch.find((o) => o.value === "ECE").count).toBe(1);
  const skills = optionCounts(rows, defs, state, defs[1]);
  expect(skills.find((o) => o.value === "Python").count).toBe(1);
  expect(skills.find((o) => o.value === "Java").count).toBe(0); // still offered, with nothing behind it
});

test("chips: one per picked option, removable one at a time", () => {
  const state = { branch: ["CSE", "ECE"], cgpa: { min: 7, max: 9 }, placed: "yes" };
  const chips = chipsFor(defs, state, rows);
  expect(chips.map((c) => c.label)).toEqual(["Branch: CSE", "Branch: ECE", "CGPA: 7–9", "Placed: Yes"]);
  expect(removeChip(state, chips[0])).toEqual({ branch: ["ECE"], cgpa: { min: 7, max: 9 }, placed: "yes" });
  expect(removeChip(removeChip(state, chips[0]), chips[1]).branch).toBeUndefined();
});

test("state survives the URL, including commas inside values, and other query keys are kept", () => {
  const state = { branch: ["ECE, IoT", "CSE"], cgpa: { min: 6.5 }, placed: "no" };
  const q = toQuery(defs, state);
  expect(fromQuery(defs, q)).toEqual({ branch: ["ECE, IoT", "CSE"], cgpa: { min: 6.5, max: undefined }, placed: "no" });
  expect(mergeQuery({ batchId: "21", tab: "students", f_old: "x" }, defs, { placed: "yes" })).toEqual({ batchId: "21", tab: "students", f_placed: "yes" });
  expect(fromQuery(defs, { f_placed: "maybe", f_cgpa: "~" })).toEqual({});
});
