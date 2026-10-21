// What each report shows (overnight audit, 5-6 Oct 2026): its columns in words people use, values in words (never codes like
// RELEASED), the one chart that answers its question, and which filters apply. Columns used to be generated from the data's own
// names ("Avg Ctc", "Percent Of Branch Results") and the chart took "the first number by the first text".
import { createElement } from "react";
import { dj } from "@/components/tpo/dj";
import { lowestPct, markOf, pctOf, pctText } from "@/components/tpo/students/academics";

const OFFER_STATUS = {
  SELECTED: "Selected (not released yet)", PENDING_VERIFICATION: "Being verified", RELEASED: "Released, waiting for the student", ACCEPTED: "Accepted",
  DECLINED: "Declined", EXPIRED: "Expired", WITHDRAWN: "Withdrawn by company", REVOKED: "Reversed",
};
const JOINING = { JOINED: "Joined", DEFERRED: "Deferred", NOT_JOINED: "Did not join" };
const lpa = (v) => (v === null || v === undefined || v === "" ? "" : `${Number(v)} LPA`);
const pct = (v) => (v === null || v === undefined || v === "" ? "" : `${Number(v)}%`);
const num = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));

/** A column: key, title, text(row) for the cell and the export, and whether it is a number (right aligned, sorted as one). */
const col = (key, title, text = (r) => r[key], opts = {}) => ({ key, title, text, ...opts });
const n = (key, title, text, opts = {}) => col(key, title, text || ((r) => r[key] ?? 0), { numeric: true, ...opts });

/** Filters a report takes: population (batch, branch) and drive (company, mode, pay category). */
const POP = ["batch", "branch"];
const ALL = ["batch", "branch", "company", "mode", "category"];

export const REPORT_VIEWS = {
  "placement-summary": {
    filters: ALL,
    columns: [col("status", "Offer status", (r) => OFFER_STATUS[r.status] || r.status), n("offers", "Offers"), n("students", "Students")],
    order: (rows) => [...rows].sort((a, b) => Object.keys(OFFER_STATUS).indexOf(a.status) - Object.keys(OFFER_STATUS).indexOf(b.status)),
    chart: { title: "Offers by status", label: (r) => OFFER_STATUS[r.status] || r.status, value: (r) => num(r.offers) },
  },
  "by-branch": {
    filters: ALL,
    columns: [col("branch", "Branch"), n("registered", "Looking for a job"), n("placed", "Placed"), n("placedPct", "Placement rate", (r) => pct(r.placedPct)),
      n("offers", "Offers"), n("avgCtc", "Average package", (r) => lpa(r.avgCtc)), n("maxCtc", "Highest package", (r) => lpa(r.maxCtc))],
    chart: { title: "Placement rate by branch", label: (r) => r.branch, value: (r) => num(r.placedPct), suffix: "%" },
  },
  "by-company": {
    filters: ALL,
    columns: [col("company", "Company"), n("drives", "Drives that ran"), n("applied", "Students applied"), n("placed", "Students placed"), n("offers", "Offers"),
      n("avgCtc", "Average package", (r) => lpa(r.avgCtc)), n("maxCtc", "Highest package", (r) => lpa(r.maxCtc))],
    chart: { title: "Students placed by company", label: (r) => r.company, value: (r) => num(r.placed) },
  },
  ctc: {
    filters: ALL,
    columns: [n("students", "Students with a package"), n("highest", "Highest", (r) => lpa(r.highest)), n("median", "Median", (r) => lpa(r.median)), n("average", "Average", (r) => lpa(r.average))],
    // The bands answer "how are packages spread", which three numbers cannot.
    chart: { title: "Students by package", fromData: (data) => (data?.bands || []).map((b) => ({ label: b.label, value: num(b.count) })) },
  },
  unplaced: {
    filters: POP,
    columns: [col("name", "Student"), col("roll", "Roll no."), col("batchName", "Batch"), col("branch", "Branch"),
      n("lowest", "Lowest %", (r) => pctText(lowestPct(r))), n("ug", "UG %", (r) => pctText(pctOf(r, "UG"))),
      col("marksVerified", "Marks verified", (r) => (!r.marks || !Object.keys(r.marks).length ? "No marks yet" : r.marksVerified ? "Verified" : "Not verified")),
      col("hasResume", "Resume", (r) => (r.hasResume ? "Uploaded" : "Missing")), n("applications", "Applications"), n("inProgress", "Still in a drive"),
      col("lastApplied", "Last applied", (r) => (r.lastApplied ? dj(r.lastApplied).format("D MMM YYYY") : "Never"))],
    chart: null,
    note: "Students looking for a job with no offer that counts as placed. Sort by Applications to find who has stopped applying; Resume and Marks show who is held back by their profile.",
  },
  "offers-acceptance": {
    filters: ALL,
    columns: [col("company", "Company"), n("released", "Released"), n("waiting", "Waiting for the student"), n("accepted", "Accepted"), n("declined", "Declined"),
      n("expired", "Expired"), n("withdrawn", "Withdrawn by company"), n("acceptancePct", "Acceptance rate", (r) => pct(r.acceptancePct), { hint: "Of the offers students answered" })],
    chart: { title: "Acceptance rate by company", label: (r) => r.company, value: (r) => num(r.acceptancePct), suffix: "%" },
  },
  "joining-status": {
    filters: ALL,
    columns: [col("company", "Company"), n("accepted", "Accepted"), n("joined", "Joined"), n("deferred", "Deferred"), n("notJoined", "Did not join"), n("notRecorded", "Not recorded yet")],
    chart: { title: "Joined by company", label: (r) => r.company, value: (r) => num(r.joined) },
  },
  "failure-reasons": {
    filters: ALL,
    columns: [col("company", "Company"), col("round", "Round"), col("branch", "Branch"), col("reason", "Reason"), n("students", "Students"),
      n("pctOfRound", "Share of the round", (r) => pct(r.pctOfRound), { hint: "Of everyone in that branch with a result in that round" })],
    chart: { title: "Students not through, by reason", group: (r) => r.reason, value: (r) => num(r.students) },
  },
  "recruiter-leads": {
    filters: [],
    columns: [col("company", "Company"), n("contacts", "Contacts"), n("invited", "Invited"), n("joined", "Joined (recruiter account)"), n("drives", "Drives that ran"), n("placed", "Students placed")],
    chart: { title: "Students placed by company", label: (r) => r.company, value: (r) => num(r.placed) },
  },
  outcomes: {
    filters: POP,
    columns: [col("name", "Student"), col("roll", "Roll no."), col("batchName", "Batch"), col("branch", "Branch"), col("outcomeName", "After college"),
      col("outcomeLabel", "Your label"), col("outcomeDetail", "Detail")],
    chart: null,
    needsBatch: "NAAC 5.2 and NIRF count one graduating batch. Pick the batch above: without one, every batch is mixed together.",
  },
  accreditation: {
    filters: ALL,
    columns: [col("studentName", "Name of the student placed"), col("rollNumber", "Roll no."), col("programme", "Programme"), col("branch", "Branch"), col("batch", "Batch"),
      col("employer", "Employer"), col("employerContact", "Employer contact"), n("packageLpa", "Package (best offer)", (r) => lpa(r.packageLpa)),
      n("offersHeld", "Offers held"), col("offerStatus", "Offer status", (r) => OFFER_STATUS[r.offerStatus] || r.offerStatus),
      col("joiningStatus", "Joining", (r) => JOINING[r.joiningStatus] || "Not recorded")],
    chart: null,
    needsBatch: "NAAC 5.2.1 lists the students of one batch. Pick the batch above.",
  },
};

/** Table columns for TpoDataTable from a report's view. */
export function tableColumns(view) {
  return (view?.columns || []).map((c) => ({
    title: c.title, key: c.key, align: c.numeric ? "right" : undefined, headerTooltip: c.hint,
    render: (_, r) => { const v = c.text(r); return v === null || v === undefined || v === "" ? createElement("span", { className: "tpo-mark is-empty" }, "-") : String(v); },
    exportValue: (r) => { const v = c.text(r); return v === null || v === undefined ? "" : v; },
    // Only number columns sort (a sort arrow on a company name or a status reads oddly).
    sorter: c.numeric ? (a, b) => num(a[c.key] ?? c.text(a)) - num(b[c.key] ?? c.text(b)) : undefined,
  }));
}

/** The chart's bars: [{ label, value }], biggest first, at most 12. */
export function chartBars(view, data) {
  const ch = view?.chart;
  if (!ch) return [];
  const rows = Array.isArray(data?.rows) ? data.rows.filter((row) => row && typeof row === "object") : [];
  let bars;
  if (ch.fromData) {
    const fromData = ch.fromData(data);
    return (Array.isArray(fromData) ? fromData : [])
      .filter((bar) => bar && bar.label !== undefined && bar.label !== null)
      .map((bar) => ({ ...bar, value: Number.isFinite(Number(bar.value)) ? Number(bar.value) : 0 }));
  } // bands keep their own order (lowest package first)
  if (ch.group) {
    const m = new Map();
    rows.forEach((r) => m.set(ch.group(r), (m.get(ch.group(r)) || 0) + ch.value(r)));
    bars = [...m.entries()].map(([label, value]) => ({ label, value }));
  } else bars = rows.map((r) => ({ label: ch.label(r), value: ch.value(r) }));
  return bars
    .filter((b) => b && b.label !== undefined && b.label !== null)
    .map((b) => ({ ...b, value: Number.isFinite(Number(b.value)) ? Number(b.value) : 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
}

export { OFFER_STATUS, markOf };
