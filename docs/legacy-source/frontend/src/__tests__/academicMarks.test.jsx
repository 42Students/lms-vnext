import { render, screen } from "@testing-library/react";
import { academicColumns, academicFilterDefs, lowestPct, markNote, markOf, marksState, pctOf, sortOnly } from "@/components/tpo/students/academics";
import { applyFilters } from "@/components/tpo/filters/filterModel";
import { gridFilterDefs } from "@/components/tpo/batches/batchRules";
import { studentFilterDefs } from "@/components/tpo/students/studentGridRules";

const ASHA = {
  learnerId: 1, passingYear: 2027, degree: "M.Tech · CSE", qualifyingExam: "EAMCET", marksVerified: true,
  marks: { "10TH": { shown: "9.2 CGPA", pct: 87.4, converted: true, verified: true }, "12TH": { shown: "88.5%", pct: 88.5, converted: false, verified: true },
    UG: { shown: "8.4 CGPA", pct: 79.8, converted: true, verified: true }, PG: { shown: "9 CGPA", pct: 85.5, converted: true, verified: true } },
};
const DEV = {
  learnerId: 2, passingYear: null, marksVerified: false,
  marks: { "10TH": { shown: "A1", pct: null, converted: true, verified: false }, DIPLOMA: { shown: "71%", pct: 71, converted: false, verified: false },
    UG: { shown: "6.4 CGPA", pct: 60.8, converted: true, verified: false } },
};
const NONE = { learnerId: 3, marks: {} };

test("every level is a percentage; the Diploma stands in for a missing 12th", () => {
  expect(pctOf(ASHA, "10TH")).toBe(87.4);
  expect(pctOf(ASHA, "PG")).toBe(85.5);
  expect(markOf(DEV, "12TH_OR_DIPLOMA").level).toBe("DIPLOMA");
  expect(pctOf(DEV, "12TH_OR_DIPLOMA")).toBe(71);
  expect(lowestPct(ASHA)).toBe(79.8);
  expect(lowestPct(DEV)).toBe(60.8); // the letter grade has no % and is left out
  expect(lowestPct(NONE)).toBeNull();
  expect([ASHA, DEV, NONE].map(marksState)).toEqual(["VERIFIED", "UNVERIFIED", "NONE"]);
  expect(markNote(markOf(ASHA, "10TH"))).toBe("Entered as 9.2 CGPA, counted by the college's CGPA rule. Verified");
  expect(markNote(markOf(DEV, "10TH"))).toMatch(/A1, a grade with no percentage\. Not verified/);
});

test("percentage filters compare across boards", () => {
  const defs = academicFilterDefs();
  const rows = [ASHA, DEV, NONE];
  expect(applyFilters(rows, defs, { tenth: { min: 80 } }).map((r) => r.learnerId)).toEqual([1]);
  // 12th and Diploma are separate filters, like the drive form's two cutoffs.
  expect(applyFilters(rows, defs, { twelfth: { min: 80 } }).map((r) => r.learnerId)).toEqual([1]);
  expect(applyFilters(rows, defs, { diploma: { min: 70, max: 80 } }).map((r) => r.learnerId)).toEqual([2]);
  expect(applyFilters(rows, defs, { twelfth: { min: 70, max: 80 } }).map((r) => r.learnerId)).toEqual([]);
  expect(applyFilters(rows, defs, { lowest: { min: 70 } }).map((r) => r.learnerId)).toEqual([1]);
  expect(applyFilters(rows, defs, { pg: { min: 80 } }).map((r) => r.learnerId)).toEqual([1]);
  expect(applyFilters(rows, defs, { marksVerified: ["UNVERIFIED", "NONE"] }).map((r) => r.learnerId)).toEqual([2, 3]);
});

test("both student grids have the same Academics section, with nothing the profile does not hold", () => {
  const keys = (defs) => defs.filter((d) => d.group === "Academics").map((d) => d.key);
  const want = ["lowest", "tenth", "twelfth", "diploma", "ug", "pg", "passingYear", "degree", "exam", "marksVerified"];
  expect(keys(gridFilterDefs([]))).toEqual(want);
  // The Students page picks the program at the top of the page, so its panel has no Degree filter.
  expect(keys(studentFilterDefs([]))).toEqual(want.filter((k) => k !== "degree"));
  const all = [...gridFilterDefs([]), ...studentFilterDefs([])].map((d) => d.key);
  ["cgpa", "gap", "backlogs"].forEach((k) => expect(all).not.toContain(k));
  // Applications and offers are filters on both
  expect(gridFilterDefs([]).filter((d) => d.group === "Drives so far").map((d) => d.key)).toEqual(["applications", "offers"]);
  expect(gridFilterDefs([]).every((d) => d.group)).toBe(true);
  // Prep test average only when someone has one
  expect(studentFilterDefs([]).some((d) => d.key === "prep")).toBe(false);
  expect(studentFilterDefs([{ prepAverage: 70 }]).some((d) => d.key === "prep")).toBe(true);
});

test("10th, 12th, Diploma and UG % show by default (outside the student sheets), as plain percentages; headers only sort", () => {
  const cols = academicColumns();
  expect(cols.filter((c) => !c.hide).map((c) => c.headerName)).toEqual(["10th %", "12th %", "Diploma %", "UG %"]);
  // On the student sheets they are export-only: never on screen, always in an export.
  expect(academicColumns({ exportOnly: true }).every((c) => c.hide && c.context.exportOnly)).toBe(true);
  expect(cols.map((c) => c.headerName)).not.toContain("CGPA");
  const tenth = cols.find((c) => c.colId === "pct_10TH");
  const Cell = tenth.cellRenderer;
  const { unmount } = render(<Cell data={ASHA} colDef={tenth} />);
  expect(screen.getByText("87.4%")).toHaveAttribute("title", expect.stringContaining("Entered as 9.2 CGPA"));
  unmount();
  render(<Cell data={DEV} colDef={tenth} />);
  expect(screen.getByText("-")).toHaveAttribute("title", expect.stringContaining("A1"));
  expect(tenth.context.exportValue(ASHA)).toBe("87.4%");
  expect(sortOnly(cols).every((c) => c.filter === false)).toBe(true);
});
