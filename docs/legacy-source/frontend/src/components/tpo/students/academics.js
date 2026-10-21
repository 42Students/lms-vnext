// Academic marks on the student grids (Students page and a batch's Students tab), all as percentages (user, 5 Oct 2026:
// "pg, ug, 12th, 10th all those should be in percentage and should be used as filters"). Every value comes from the
// student's Education in their profile: verified marks first, else their own entry (greyed, "not verified"). A CGPA or a
// grade is turned into a % with the college's rule (Settings > Placement rules); hovering shows the mark as entered.
// Drive eligibility uses the same numbers ("% throughout" = Lowest %).
import { createElement } from "react";

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
export const pctText = (v) => (v === null || v === undefined ? "" : `${Number(Number(v).toFixed(1))}%`);

/**
 * A level's mark, or null. "12TH_OR_DIPLOMA" is the mark that counts as the student's 12th-level, exactly as drive eligibility
 * decides (the server sends row.twelfthLevel): the Diploma for lateral entry or for a Diploma and no 12th, else the 12th.
 */
export function markOf(row, level) {
  const m = row?.marks || {};
  const lateral = Boolean(row?.lateralEntry);
  if (level === "12TH_OR_DIPLOMA") {
    const which = row?.twelfthLevel || (m["12TH"] ? "12TH" : m.DIPLOMA ? "DIPLOMA" : "12TH");
    return m[which] ? { ...m[which], level: which, lateral } : null;
  }
  return m[level] ? { ...m[level], level, lateral } : null;
}
export const pctOf = (row, level) => num(markOf(row, level)?.pct);

/** The lowest of 10th, the 12th-level mark (12th or Diploma, the drive's rule) and UG: what a drive's "% throughout" checks. */
export function lowestPct(row) {
  const all = ["10TH", "12TH_OR_DIPLOMA", "UG"].map((l) => pctOf(row, l)).filter((v) => v !== null);
  return all.length ? Math.min(...all) : null;
}

/** What hovering a % says: the mark as entered, how it was counted, and whether the college verified it. */
export function markNote(mark) {
  if (!mark) return "";
  return [
    mark.level === "DIPLOMA" ? (mark.lateral ? "Diploma (lateral entry)" : "Diploma (no 12th)") : null,
    mark.converted && mark.pct !== null && mark.pct !== undefined ? `Entered as ${mark.shown}, counted by the college's CGPA rule` : null,
    mark.pct === null || mark.pct === undefined ? `Entered as ${mark.shown}, a grade with no percentage` : null,
    mark.verified === false ? "Not verified by the college yet" : "Verified",
  ].filter(Boolean).join(". ");
}

function PctCell({ data, colDef }) {
  const mark = markOf(data, colDef.context.level);
  if (!mark || mark.pct === null || mark.pct === undefined) {
    return createElement("span", { className: "tpo-mark is-empty", title: mark ? markNote(mark) : undefined }, "-");
  }
  return createElement("span", { className: `tpo-mark${mark.verified === false ? " is-unverified" : ""}`, title: markNote(mark) },
    pctText(mark.pct),
    mark.level === "DIPLOMA" && colDef.context.level === "12TH_OR_DIPLOMA" ? createElement("span", { className: "tpo-mark__tag" }, "Dip") : null);
}

const pctColumn = (level, headerName, hide) => ({
  colId: `pct_${level}`, headerName, width: 125, hide, type: "numericColumn", cellRenderer: PctCell,
  valueGetter: (p) => pctOf(p.data, level),
  context: { level, exportValue: (r) => pctText(pctOf(r, level)) },
});

export const MARKS_STATE = { VERIFIED: "Verified", UNVERIFIED: "Not verified", NONE: "No marks yet" };
export const marksState = (r) => (!r?.marks || !Object.keys(r.marks).length ? "NONE" : r.marksVerified ? "VERIFIED" : "UNVERIFIED");

/**
 * Academic columns. On the student sheets (Students, a batch's Students) marks are filtered in the Filters panel, not shown
 * (user, 5 Oct 2026: "we remove the 10th ug pg etc and move to filter page"), so they are export-only: never on screen or in
 * Columns, always in an Excel / CSV export. exportOnly=false keeps the old visible columns for any other grid.
 */
export function academicColumns({ exportOnly = false } = {}) {
  const cols = [
    pctColumn("10TH", "10th %", false),
    pctColumn("12TH", "12th %", false),
    pctColumn("DIPLOMA", "Diploma %", false),
    pctColumn("UG", "UG %", false),
    pctColumn("PG", "PG %", true),
    { colId: "lowestPct", headerName: "Lowest %", width: 115, hide: true, type: "numericColumn",
      headerTooltip: "The lowest of 10th, 12th (or Diploma) and UG: what a drive's \"% throughout\" checks",
      valueGetter: (p) => lowestPct(p.data), valueFormatter: (p) => pctText(p.value), context: { exportValue: (r) => pctText(lowestPct(r)) } },
    { field: "passingYear", colId: "passingYear", headerName: "Passing year", width: 115, type: "numericColumn", hide: true },
    { field: "degree", colId: "degree", headerName: "Degree", minWidth: 150, flex: 1, hide: true },
    { field: "qualifyingExam", colId: "qualifyingExam", headerName: "Entrance exam", width: 140, hide: true },
    { colId: "marksVerified", headerName: "Marks verified", width: 130, hide: true,
      valueGetter: (p) => marksState(p.data), valueFormatter: (p) => MARKS_STATE[p.value] || "" },
  ];
  if (!exportOnly) return cols;
  return cols.map((c) => ({ ...c, hide: true, lockVisible: true, context: { ...(c.context || {}), exportAlways: true, exportOnly: true } }));
}

/** The Academics section of a filter panel. Every one is filled from the student's Education in their profile. */
export function academicFilterDefs(group = "Academics", { degree = true } = {}) {
  return [
    { group, key: "lowest", label: "Lowest % (10th, 12th or Diploma, UG)", type: "range", get: lowestPct, min: 0, max: 100 },
    { group, key: "tenth", label: "10th %", type: "range", get: (r) => pctOf(r, "10TH"), min: 0, max: 100 },
    // 12th and Diploma apart, like the drive form's two cutoffs ("12th minimum", "Diploma minimum").
    { group, key: "twelfth", label: "12th %", type: "range", get: (r) => pctOf(r, "12TH"), min: 0, max: 100 },
    { group, key: "diploma", label: "Diploma %", type: "range", get: (r) => pctOf(r, "DIPLOMA"), min: 0, max: 100 },
    { group, key: "ug", label: "UG %", type: "range", get: (r) => pctOf(r, "UG"), min: 0, max: 100 },
    { group, key: "pg", label: "PG %", type: "range", get: (r) => pctOf(r, "PG"), min: 0, max: 100 },
    { group, key: "passingYear", label: "Passing year", type: "checklist", get: (r) => (r.passingYear ? String(r.passingYear) : "Not given") },
    ...(degree ? [{ group, key: "degree", label: "Degree", type: "checklist", get: (r) => r.degree || "Not given" }] : []),
    { group, key: "exam", label: "Entrance exam", type: "checklist", get: (r) => r.qualifyingExam || "Not given" },
    { group, key: "marksVerified", label: "Marks verified", type: "checklist", get: marksState,
      options: Object.entries(MARKS_STATE).map(([value, label]) => ({ value, label })) },
  ];
}

/** Filtering lives in the Filters panel only: column headers sort, they do not filter. */
export const sortOnly = (columns) => columns.map((c) => ({ ...c, filter: false, floatingFilter: false }));

/** One % as a table cell (the simpler table format: render(value, row)). Hover shows the mark as entered; grey when not verified. */
function pctCell(row, level) {
  const mark = markOf(row, level);
  if (!mark || mark.pct === null || mark.pct === undefined) {
    return createElement("span", { className: "tpo-mark is-empty", title: mark ? markNote(mark) : undefined }, "-");
  }
  return createElement("span", { className: `tpo-mark${mark.verified === false ? " is-unverified" : ""}`, title: markNote(mark) },
    pctText(mark.pct), mark.level === "DIPLOMA" && level === "12TH_OR_DIPLOMA" ? createElement("span", { className: "tpo-mark__tag" }, "Dip") : null);
}

/** The same academic columns for tables built from title/render columns (TpoDataTable: Applicants and others). */
export function academicTableColumns({ exportOnly = false } = {}) {
  const pct = (level, title, hidden) => ({
    title, key: `pct_${level}`, align: "right", defaultHidden: hidden, render: (_, r) => pctCell(r, level),
    sorter: (a, b) => (pctOf(a, level) ?? -1) - (pctOf(b, level) ?? -1), exportValue: (r) => pctText(pctOf(r, level)),
  });
  const cols = [
    pct("10TH", "10th %", false),
    pct("12TH", "12th %", false),
    pct("DIPLOMA", "Diploma %", false),
    pct("UG", "UG %", false),
    pct("PG", "PG %", true),
    { title: "Lowest %", key: "lowestPct", align: "right", defaultHidden: true, render: (_, r) => pctText(lowestPct(r)) || "-",
      sorter: (a, b) => (lowestPct(a) ?? -1) - (lowestPct(b) ?? -1), exportValue: (r) => pctText(lowestPct(r)) },
    { title: "Passing year", dataIndex: "passingYear", key: "passingYear", defaultHidden: true },
    { title: "Degree", dataIndex: "degree", key: "degree", defaultHidden: true },
    { title: "Entrance exam", dataIndex: "qualifyingExam", key: "qualifyingExam", defaultHidden: true },
    { title: "Marks verified", key: "marksVerified", defaultHidden: true, render: (_, r) => MARKS_STATE[marksState(r)], exportValue: (r) => MARKS_STATE[marksState(r)] },
  ];
  return exportOnly ? cols.map((c) => ({ ...c, exportOnly: true })) : cols;
}
