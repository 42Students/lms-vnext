import { bodyOf, factsOf, hasCustomColumns, memoryOf, rulesLine, sameEverything, sameList, sortOf, suggestName } from "../viewMemory";

const defs = [
  { key: "batch", label: "Batch", type: "checklist", get: (r) => r.batch, options: [{ value: "8", label: "B.Tech CSE · 2026-2027 Batch" }] },
  { key: "program", label: "Program", type: "checklist", get: (r) => r.program },
  { key: "branch", label: "Department", type: "checklist", get: (r) => r.branch },
  { key: "cgpa", label: "CGPA", type: "range", get: (r) => r.cgpa },
];
const rows = [{ batch: "8", program: "B.Tech CSE", branch: "CSE", cgpa: 8 }, { batch: "8", program: "B.Tech CSE", branch: "ECE", cgpa: 6 }];

describe("what a view remembers", () => {
  test("batch drops its program prefix when Program is picked too, and neither repeats its own name (R4)", () => {
    const facts = factsOf(defs, { batch: ["8"], program: ["B.Tech CSE"], branch: ["CSE", "ECE"], cgpa: { min: 7 } }, rows);
    expect(facts.map((f) => f.text)).toEqual(["2026-2027 Batch", "B.Tech CSE", "Department CSE, ECE", "CGPA 7+"]);
  });

  test("a page's own filters are described, so a narrowed list is never 'Everyone' (R6)", () => {
    expect(rulesLine(memoryOf({ defs, panel: {}, rows, extra: { stage: ["APPLIED"], onlyMine: true } }))).toBe("Stage APPLIED · Only Mine Yes");
    expect(rulesLine(memoryOf({ defs, panel: {}, rows, extra: { stage: [], note: "" } }))).toBe("Everyone, no filters");
  });

  test("sort is part of the description (R3)", () => {
    const columns = [{ field: "name", headerName: "Student" }, { field: "cgpa", headerName: "CGPA" }];
    expect(sortOf(columns, [{ colId: "cgpa", sort: "desc", sortIndex: 0 }])).toBe("CGPA, high to low");
    expect(rulesLine({ facts: [], sort: "CGPA, high to low" })).toBe("sorted by CGPA, high to low");
  });

  test("export-only columns and columns the page hides itself are not 'custom columns' (R1, R2)", () => {
    const columns = [
      { field: "name" }, { field: "branch", hide: true }, { field: "tenth", context: { exportOnly: true } },
    ];
    const state = [{ colId: "name" }, { colId: "branch", hide: true }, { colId: "tenth", hide: true }];
    expect(hasCustomColumns(columns, state)).toBe(false);
    expect(hasCustomColumns(columns, [{ colId: "branch", hide: true }, { colId: "name" }, { colId: "tenth", hide: true }])).toBe(true);
    expect(hasCustomColumns(columns, [{ colId: "name", hide: true }, { colId: "branch", hide: true }])).toBe(true);
  });

  test("old views (page filters at the top level) are read as page filters, not as 'no filters' (D4)", () => {
    expect(bodyOf({ filters: JSON.stringify({ stage: "APPLIED", q: "x" }) })).toEqual({ panel: {}, q: "x", extra: { stage: "APPLIED" } });
    expect(bodyOf({ filters: "not json" })).toEqual({ panel: {}, q: "", extra: {} });
  });
});

describe("suggested names", () => {
  const facts = factsOf(defs, { program: ["B.Tech CSE"], branch: ["CSE"] }, rows);
  test("one specific fact leads with who it is", () => expect(suggestName(facts, "")).toBe("B.Tech CSE · CSE"));
  test("never repeats a name already used (D9)", () => {
    expect(suggestName(facts, "", ["b.tech cse · cse"])).toBe("B.Tech CSE · CSE 2");
    expect(suggestName(facts, "", ["B.Tech CSE · CSE", "B.Tech CSE · CSE 2"])).toBe("B.Tech CSE · CSE 3");
  });
  test("ranges keep their name; long lists are shortened", () => {
    const f = factsOf(defs, { branch: ["CSE", "ECE", "EEE", "MECH"], cgpa: { min: 7 } }, rows);
    expect(suggestName(f, "")).toBe("CSE, ECE +2 · CGPA 7+");
  });
  test("nothing picked still gives a name", () => expect(suggestName([], "")).toBe("My view"));
});

describe("duplicate check", () => {
  test("order of picks, numbers as text, empty values and search spacing do not matter (D1, D2, D3)", () => {
    const a = { panel: { branch: ["CSE", "ECE"], cgpa: { min: 7, max: "" }, year: [] }, q: " Reddy ", extra: {} };
    const b = { panel: { branch: ["ECE", "CSE"], cgpa: { min: "7" } }, q: "reddy", extra: { stage: [] } };
    expect(sameList(a, b)).toBe(true);
  });
  test("a different search or page filter is a different list", () => {
    expect(sameList({ panel: {}, q: "a" }, { panel: {}, q: "b" })).toBe(false);
    expect(sameList({ panel: {}, extra: { stage: "LIVE" } }, { panel: {}, extra: { stage: "CLOSED" } })).toBe(false);
  });
  test("an old page-filter view does not match a plain unfiltered list (D4)", () => {
    expect(sameList(bodyOf({ filters: { stage: "LIVE" } }), { panel: {}, q: "", extra: {} })).toBe(false);
  });
  test("same list with different columns or sort is told apart (D6)", () => {
    const base = { panel: { branch: ["CSE"] }, q: "" };
    expect(sameEverything({ ...base, columns: [{ colId: "a" }] }, { ...base, columns: [{ colId: "a" }] })).toBe(true);
    expect(sameEverything({ ...base, columns: [{ colId: "a" }] }, { ...base, columns: [{ colId: "a", sort: "asc" }] })).toBe(false);
    expect(sameEverything({ ...base, columns: [{ colId: "a" }] }, { ...base, columns: [{ colId: "a", hide: true }] })).toBe(false);
  });
});
