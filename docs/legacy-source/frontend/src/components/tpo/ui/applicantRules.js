// Pure rules for the Applicants tab: column filters, which moves are allowed, what a move does to students, and letter matching.
import { dj } from "@/components/tpo/dj";
import { STAGE_LABEL } from "./labels";
import { academicFilterDefs } from "@/components/tpo/students/academics";

export const ACTIVE_STAGES = ["APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED"];
export const FINAL_STAGES = ["OFFERED", "HIRED", "REJECTED", "WITHDRAWN"];

/**
 * Filter applicants by the columns a TPO actually cares about.
 * filters: { branches: string[], minCgpa: number|null, resume: "any"|"has"|"none", minSkill: number|null }
 * A student with no CGPA on record fails a minimum-CGPA filter (the TPO asked for 7+; "unknown" is not 7+).
 */
export function filterApplicants(rows, f = {}) {
  const branches = (f.branches || []).filter(Boolean);
  return (rows || []).filter((a) => {
    if (branches.length && !branches.includes(a.branch)) return false;
    if (f.minCgpa != null && f.minCgpa !== "" && !(Number(a.cgpa) >= Number(f.minCgpa))) return false;
    if (f.resume === "has" && !a.hasResume) return false;
    if (f.resume === "none" && a.hasResume) return false;
    if (f.minSkill != null && f.minSkill !== "" && !(Number(a.skillMatch) >= Number(f.minSkill))) return false;
    return true;
  });
}

export const EMPTY_APPLICANT_FILTERS = { branches: [], minCgpa: null, resume: "any", minSkill: null };

/** A round result as people say it. */
export const RESULT_LABEL = { PASS: "Cleared", FAIL: "Not cleared", HOLD: "Waitlisted", ABSENT: "Absent" };

const truthy = (v) => v === true || v === 1;
/** What can be wrong with an applicant, as filter values (the Flags column). */
export const applicantFlags = (r) => [
  r.ineligibleFlagAt && "INELIGIBLE", truthy(r.withdrawalRequested) && "WITHDRAWAL", Number(r.noShows) > 0 && "NO_SHOW",
  r.withdrawalReason === "PLACED_ELSEWHERE" && "PLACED_ELSEWHERE", r.appliedByCollege && "ADDED_BY_COLLEGE",
].filter(Boolean);

// One word per stage, everywhere: the shared labels module owns them.
export { STAGE_LABEL } from "./labels";
const APPLIED_ON = [["TODAY", "Today"], ["WEEK", "In the last 7 days"], ["EARLIER", "Earlier"]];
const appliedOn = (r) => {
  if (!r.appliedAt) return "EARLIER";
  const at = dj(r.appliedAt);
  return at.isAfter(dj().startOf("day")) ? "TODAY" : at.isAfter(dj().subtract(7, "day")) ? "WEEK" : "EARLIER";
};

/**
 * The Applicants filter side panel (filters/filterModel), in sections like the Students page: where they are in this drive,
 * their marks (the same as Students and drive eligibility), and who they are. Stage is a filter too; the stage bar above the
 * list is its quick switch.
 */
// ---- The drive's journey (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md): where the applicants are NOW, as steps that nest
// (a later step is inside the one before) and the work between them. A rejected or withdrawn applicant counts only as Applied.
const ORDER = { APPLIED: 0, SHORTLISTED: 1, ASSESSMENT: 2, INTERVIEW: 3, WAITLISTED: 3, OFFERED: 4, HIRED: 5 };
const at = (r, n) => (ORDER[r.stage] ?? -1) >= n;
export const DRIVE_JOURNEY = [
  { key: "D_APPLIED", label: "Applied", step: true, test: () => true },
  { key: "D_SHORTLISTED", label: "Shortlisted", step: true, test: (r) => at(r, 1) },
  // "Interview", not "Interviewed": it counts everyone who reached the interview stage, scheduled ones too (test run, 15 Oct 2026).
  { key: "D_INTERVIEW", label: "Interview", step: true, test: (r) => at(r, 3) },
  { key: "D_OFFERED", label: "Offered", step: true, test: (r) => at(r, 4) },
  { key: "D_PLACED", label: "Placed", step: true, test: (r) => r.stage === "HIRED" },
  { key: "D_GAP_REVIEW", label: "To review", after: "D_APPLIED", test: (r) => r.stage === "APPLIED" },
  { key: "D_GAP_BEFORE_INTERVIEW", label: "Before interview", after: "D_SHORTLISTED", test: (r) => ["SHORTLISTED", "ASSESSMENT"].includes(r.stage) },
  { key: "D_GAP_DECISION", label: "No decision yet", after: "D_INTERVIEW", test: (r) => ["INTERVIEW", "WAITLISTED"].includes(r.stage) },
  { key: "D_GAP_ANSWER", label: "Not answered", after: "D_OFFERED", test: (r) => r.stage === "OFFERED" },
  { key: "D_NOT_SELECTED", label: "Not selected", extra: true, test: (r) => r.stage === "REJECTED" },
  { key: "D_WITHDRAWN", label: "Withdrawn", extra: true, test: (r) => r.stage === "WITHDRAWN" },
  { key: "D_FLAGGED", label: "Flagged", extra: true, test: (r) => applicantFlags(r).length > 0 },
  { key: "D_NO_RESUME", label: "No resume", extra: true, test: (r) => !r.hasResume },
];

export const applicantFilterDefs = () => [
  // The strip at the top of the list (panel: false): a step, a gap or a link, shown as a chip.
  { group: "In this drive", key: "djourney", label: "Journey", type: "checklist", panel: false,
    get: (r) => DRIVE_JOURNEY.filter((j) => j.test(r)).map((j) => j.key), options: DRIVE_JOURNEY.map((j) => ({ value: j.key, label: j.label })) },
  { group: "In this drive", key: "stage", label: "Stage", type: "checklist", get: (r) => r.stage,
    options: Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label })) },
  { group: "In this drive", key: "round", label: "Current round", type: "checklist", get: (r) => r.currentRound || "Not in a round" },
  { group: "In this drive", key: "lastResult", label: "Last result", type: "checklist", get: (r) => r.lastResult || "NONE", format: (v) => RESULT_LABEL[v] || (v === "NONE" ? "No result yet" : v) },
  { group: "In this drive", key: "flags", label: "Flags", type: "checklist", get: (r) => { const f = applicantFlags(r); return f.length ? f : ["NONE"]; },
    options: [{ value: "INELIGIBLE", label: "Now ineligible" }, { value: "WITHDRAWAL", label: "Withdrawal requested" }, { value: "NO_SHOW", label: "No-show" },
      { value: "PLACED_ELSEWHERE", label: "Placed elsewhere" }, { value: "ADDED_BY_COLLEGE", label: "Added by college" }, { value: "NONE", label: "No flags" }] },
  { group: "In this drive", key: "appliedOn", label: "Applied", type: "checklist", get: appliedOn, options: APPLIED_ON.map(([value, label]) => ({ value, label })) },
  { group: "In this drive", key: "skill", label: "Skill match (%)", type: "range", get: (r) => (r.skillMatch == null ? null : Math.round(Number(r.skillMatch))), min: 0, max: 100 },
  ...academicFilterDefs("Academics"),
  { group: "Student", key: "batch", label: "Batch", type: "checklist", get: (r) => r.batchName || "No batch" },
  { group: "Student", key: "branch", label: "Branch", type: "checklist", get: (r) => r.branch || "Not set" },
  { group: "Student", key: "gender", label: "Gender", type: "checklist", get: (r) => r.gender || "Not given" },
  { group: "Student", key: "resume", label: "Resume", type: "yesno", get: (r) => Boolean(r.hasResume), yes: "Uploaded", no: "Missing" },
];

/** A view saved before the side panel ({ stage, branches, minCgpa, resume, minSkill }) read the new way. */
export function legacyApplicantFilters(f = {}) {
  const out = {};
  if (f.stage && f.stage !== "ALL") out.stage = [f.stage];
  if (f.branches?.length) out.branch = f.branches;
  if (f.minCgpa != null && f.minCgpa !== "") out.cgpa = { min: Number(f.minCgpa) };
  if (f.minSkill != null && f.minSkill !== "") out.skill = { min: Number(f.minSkill) };
  if (f.resume === "has") out.resume = "yes";
  if (f.resume === "none") out.resume = "no";
  return out;
}

/** How many filters are switched on (for the "Clear (n)" button). */
export function activeFilterCount(f = {}) {
  return (f.branches?.length ? 1 : 0) + (f.minCgpa != null && f.minCgpa !== "" ? 1 : 0)
    + (f.resume && f.resume !== "any" ? 1 : 0) + (f.minSkill != null && f.minSkill !== "" ? 1 : 0);
}

/** Board columns, in order. Offered/Placed/Waitlisted come from offers and results, so they are shown but are not drop targets. */
export const BOARD_COLUMNS = [
  { key: "APPLIED", label: "Applied", drop: false },
  { key: "SHORTLISTED", label: "Shortlisted", drop: true },
  { key: "ASSESSMENT", label: "Test", drop: true },
  { key: "INTERVIEW", label: "Interview", drop: true },
  { key: "REJECTED", label: "Not selected", drop: true },
  // Set by results, offers and the student: shown so nobody disappears from the board, but never dropped on.
  { key: "WAITLISTED", label: "Waitlisted", drop: false },
  { key: "OFFERED", label: "Offered", drop: false },
  { key: "HIRED", label: "Placed", drop: false },
  { key: "WITHDRAWN", label: "Withdrawn", drop: false },
];

/** Can a card in `from` be dropped into `to`? Only forwards or sideways to a drop column, never out of a final stage. */
export function canMove(from, to) {
  if (!from || !to || from === to) return false;
  if (FINAL_STAGES.includes(from)) return false;
  const col = BOARD_COLUMNS.find((c) => c.key === to);
  return Boolean(col && col.drop);
}

/** The sentence shown before a move is made: who is told and what happens to them. */
export function moveConsequence(to, count = 1) {
  const who = count === 1 ? "1 student" : `${count} students`;
  switch (to) {
    case "SHORTLISTED": return `${who} will be told they are shortlisted.`;
    case "ASSESSMENT": return `${who} will be told about the test.`;
    case "INTERVIEW": return `${who} will be moved to the interview stage and told.`;
    case "REJECTED": return `${who} will be told they were not selected. Your reason stays inside the placement cell.`;
    default: return `${who} will be moved.`;
  }
}

const stem = (name) => String(name || "").replace(/\.[^.]+$/, "").trim().toUpperCase();

/**
 * Offer letters named by roll number ("21CS001.pdf", "21CS001_offer.pdf", "offer-21cs001.pdf") matched to offers.
 * Returns { matches: [{ file, offer }], unmatched: [file], ambiguous: [file] }.
 * A file matches only if exactly one roll number appears in its name as a whole token, so "21CS0011.pdf" never lands on 21CS001.
 */
export function matchLettersToOffers(files, offers) {
  const rolls = (offers || []).filter((o) => o.rollNumber).map((o) => ({ roll: String(o.rollNumber).trim().toUpperCase(), offer: o }));
  const matches = []; const unmatched = []; const ambiguous = [];
  const used = new Set();
  (files || []).forEach((file) => {
    const name = stem(file.name);
    const tokens = new Set(name.split(/[^A-Z0-9]+/).filter(Boolean));
    const hits = rolls.filter((r) => tokens.has(r.roll));
    if (hits.length === 1) {
      const offer = hits[0].offer;
      if (used.has(offer.offerId)) { ambiguous.push(file); return; }
      used.add(offer.offerId);
      matches.push({ file, offer });
    } else if (hits.length > 1) ambiguous.push(file);
    else unmatched.push(file);
  });
  return { matches, unmatched, ambiguous };
}
