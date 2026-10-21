// The Students page on the grid (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md): only students in placements, batch chips,
// a Stage column and one filter panel built from these definitions.
import { dj } from "@/components/tpo/dj";
import { FALLBACK_CHOICES, OUTCOMES } from "@/config/choices";
import { academicFilterDefs } from "./academics";

export const STAGES = [
  ["ELIGIBLE", "Eligible", "default"], ["INVITED", "Invited", "blue"], ["REGISTERED", "Registered", "geekblue"],
  ["VERIFIED", "Verified", "cyan"], ["PLACED", "Placed", "green"],
];
export const STAGE = Object.fromEntries(STAGES.map(([k, label, color]) => [k, { label, color }]));
export const STATUS = {
  NOT_REGISTERED: ["Not registered", "default"], REGISTERED: ["Registered", "blue"], PLACED: ["Placed", "green"],
  HIGHER_STUDIES: ["Higher studies", "purple"], ENTREPRENEURSHIP: ["Entrepreneurship", "cyan"], COMPETITIVE_EXAMS: ["Competitive exams", "geekblue"],
  NOT_INTERESTED: ["Not interested", "default"], DEBARRED: ["Debarred", "red"],
};
export const PROFILE = { VERIFIED: ["Verified", "green"], PENDING: ["Waiting to verify", "gold"], SENT_BACK: ["Sent back", "orange"], INCOMPLETE: ["Not verified", "default"] };

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const birthYear = (dob) => { if (!dob) return null; const d = dj(dob); return d.isValid() ? d.year() : null; };

/** "From B.Tech CSE 2022-26" for a student of a finished batch, so it is clear why they are an exception. */
export const finishedTag = (r) => (r.batchFinished ? `From ${r.batchName || (r.batchEndDate ? String(r.batchEndDate).slice(0, 4) : "an earlier batch")}` : null);

/** A batch as a filter value: its id, or "none". */
export const batchKey = (r) => (r.batchId === null || r.batchId === undefined ? "none" : String(r.batchId));

/** Batches present in the list (for the Batch selector), working ones first, finished last, each with its program. */
export function batchesOf(rows) {
  const m = new Map();
  (rows || []).forEach((r) => {
    const k = batchKey(r);
    const b = m.get(k) || { key: k, name: r.batchName || "No batch", program: r.programName || null, finished: Boolean(r.batchFinished), count: 0 };
    b.count += 1;
    m.set(k, b);
  });
  return [...m.values()].sort((a, b) => Number(a.finished) - Number(b.finished) || String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
}

/** A student's class as a filter value: its id, so two classes with the same name in different batches stay apart. */
export const classKey = (r) => (r.classId == null ? "none" : String(r.classId));

/**
 * The classes among these students: [{ value, label, batchKey, count }]. The name alone ("CSE - A") unless another batch has a
 * class with the same name; then the batch is added ("CSE - A · 2026-2027 Batch").
 */
export function classesOf(rows) {
  const m = new Map();
  (rows || []).forEach((r) => {
    const k = classKey(r);
    const c = m.get(k) || { value: k, name: r.className || "No class", batchName: r.batchName || "", batchKey: batchKey(r), count: 0 };
    c.count += 1;
    m.set(k, c);
  });
  const list = [...m.values()];
  const repeated = new Set(list.map((c) => c.name).filter((n, i, all) => all.indexOf(n) !== i));
  return list
    .map((c) => ({ ...c, label: repeated.has(c.name) && c.batchName ? `${c.name} · ${c.batchName}` : c.name }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

/** Students of finished batches are left out unless the Batch filter picks their batch. */
export const workingSet = (rows, state) => {
  if (state?.batch?.length) return rows || [];
  return (rows || []).filter((r) => !r.batchFinished);
};

/** "B.Tech CSE · 2026-2027 Batch": a batch with its program (batch names alone often do not say which program). */
export const batchLabel = (b) => (b.program ? `${b.program} · ${b.name}` : b.name);

// ---- the journey strip (docs/tpo-ux/STUDENTS-ACTIONS-PLAN-2026-10-05.md §A) --------------------------------------------------
// Steps count everyone who reached them, so each step is inside the one before (a funnel); gaps are the work between two steps.
// Profile verification is not a step: students apply before their profile is verified (on real data 2 verified, 13 applying), so
// as a step it broke the funnel. It is a link beside the strip instead. One filter ("journey") so a step, a gap or that link is a
// normal chip, removable like any other.
const registeredOf = (r) => ["REGISTERED", "VERIFIED", "PLACED"].includes(r.stage);
const placedOf = (r) => r.stage === "PLACED";
export const JOURNEY = [
  { key: "ALL", label: "In placements", step: true, test: () => true },
  { key: "REGISTERED", label: "Registered", step: true, test: registeredOf },
  { key: "APPLYING", label: "Applying", step: true, test: (r) => registeredOf(r) && (Number(r.applications) > 0 || placedOf(r)) },
  { key: "PLACED", label: "Placed", step: true, test: placedOf },
  // gaps, each between the step before and the step after
  { key: "GAP_NOT_REGISTERED", label: "Not registered", after: "ALL", test: (r) => r.status === "NOT_REGISTERED" },
  { key: "GAP_NOT_APPLYING", label: "Not applying", after: "REGISTERED", test: (r) => registeredOf(r) && !placedOf(r) && !r.debarred && !(Number(r.applications) > 0) },
  { key: "GAP_UNPLACED", label: "Not placed yet", after: "APPLYING", test: (r) => registeredOf(r) && !placedOf(r) && Number(r.applications) > 0 },
  // beside the strip
  { key: "GAP_NOT_VERIFIED", label: "Registered, profile not verified", extra: true, test: (r) => registeredOf(r) && !placedOf(r) && r.profileStatus !== "VERIFIED" },
];
export const journeyOf = (r) => JOURNEY.filter((j) => j.key !== "ALL" && j.test(r)).map((j) => j.key);

// Filters in the order a placement cell thinks: who (batch, branch, where they are), academics, the person, how strong the
// profile is, and what happened in drives. Registration is not a filter of its own: Outcome and Stage say the same, better.
const P = "Placement"; const A = "Academics"; const W = "Person"; const S = "Profile strength"; const D = "Drives so far";
export const studentFilterDefs = (rows) => [
  // Batch, Program, Department and Class are the selectors at the top of the page (panel: false): one place each.
  { group: P, key: "batch", label: "Batch", type: "checklist", panel: false, get: batchKey,
    options: batchesOf(rows).map((b) => ({ value: b.key, label: b.finished ? `${batchLabel(b)} (finished)` : batchLabel(b) })) },
  { group: P, key: "program", label: "Program", type: "checklist", panel: false, get: (r) => r.programName || "Not set" },
  { group: P, key: "branch", label: "Department", type: "checklist", panel: false, get: (r) => r.branch || "Not set" },
  { group: P, key: "journey", label: "Journey", type: "checklist", panel: false, get: journeyOf,
    options: JOURNEY.filter((j) => j.key !== "ALL").map((j) => ({ value: j.key, label: j.label })) },
  { group: P, key: "class", label: "Class", type: "checklist", panel: false, get: classKey,
    options: classesOf(rows).map((c) => ({ value: c.value, label: c.label })) },
  { group: P, key: "stage", label: "Stage", type: "checklist", get: (r) => r.stage || "ELIGIBLE", options: STAGES.map(([value, label]) => ({ value, label })) },
  { group: P, key: "outcome", label: "After college", type: "checklist", get: (r) => r.outcome || "NOT_REGISTERED", options: OUTCOMES.map((o) => ({ value: o.value, label: o.label })) },
  { group: P, key: "profile", label: "Profile verified", type: "checklist", get: (r) => r.profileStatus || "INCOMPLETE",
    options: Object.entries(PROFILE).map(([value, [label]]) => ({ value, label })) },
  ...academicFilterDefs(A, { degree: false }),
  { group: W, key: "gender", label: "Gender", type: "checklist", get: (r) => r.gender || "Not given" },
  { group: W, key: "birthYear", label: "Year of birth", type: "range", get: (r) => birthYear(r.dob), min: 1980, max: 2015 },
  { group: S, key: "resume", label: "Resume", type: "yesno", get: (r) => Boolean(r.hasResume), yes: "Uploaded", no: "Missing",
    chip: (v) => (v === "no" ? "No resume" : "Resume uploaded") },
  { group: S, key: "skills", label: "Skills", type: "checklist", get: (r) => r.skills || [] },
  { group: S, key: "skillsCount", label: "Number of skills", type: "range", get: (r) => num(r.skillsCount) ?? 0, min: 0 },
  { group: S, key: "projectsCount", label: "Projects", type: "range", get: (r) => num(r.projectsCount) ?? 0, min: 0 },
  { group: S, key: "certificationsCount", label: "Certifications", type: "range", get: (r) => num(r.certificationsCount) ?? 0, min: 0 },
  { group: S, key: "experienceCount", label: "Experience entries", type: "range", get: (r) => num(r.experienceCount) ?? 0, min: 0 },
  { group: S, key: "links", label: "Profile links", type: "checklist",
    get: (r) => { const l = [r.hasGithub && "GITHUB", r.hasLinkedin && "LINKEDIN", r.hasPortfolio && "PORTFOLIO"].filter(Boolean); return l.length ? l : ["NONE"]; },
    options: [{ value: "GITHUB", label: "GitHub" }, { value: "LINKEDIN", label: "LinkedIn" }, { value: "PORTFOLIO", label: "Portfolio" }, { value: "NONE", label: "None added" }] },
  { group: S, key: "coding", label: "Coding profiles", type: "checklist", get: (r) => (r.codingPlatforms?.length ? r.codingPlatforms : ["NONE"]),
    options: [...FALLBACK_CHOICES.codingPlatforms.map((pl) => ({ value: pl.value, label: pl.label })), { value: "NONE", label: "None added" }] },
  { group: D, key: "applications", label: "Applications", type: "range", get: (r) => num(r.applications) ?? 0, min: 0 },
  { group: D, key: "offers", label: "Offers", type: "range", get: (r) => num(r.offers) ?? 0, min: 0 },
  { group: D, key: "offerWaiting", label: "Offer waiting on their answer", type: "yesno", get: (r) => num(r.offersWaiting) > 0, yes: "Waiting", no: "None waiting",
    chip: (v) => (v === "yes" ? "Offer waiting on their answer" : "No offer waiting") },
  { group: D, key: "company", label: "Interviewed with", type: "checklist", get: (r) => [...new Set((r.journey || []).map((e) => e.company).filter(Boolean))] },
  { group: D, key: "best", label: "Furthest so far", type: "checklist", get: (r) => (r.best?.label ? r.best.label : "Not applied yet") },
  // Prep test average only when the college has prep courses set (Settings): otherwise nobody has one.
  ...((rows || []).some((r) => r.prepAverage !== null && r.prepAverage !== undefined)
    ? [{ group: "Prep tests", key: "prep", label: "Prep test average (%)", type: "range", get: (r) => num(r.prepAverage), min: 0, max: 100 }] : []),
];

/** Counts for the line above the grid. */
export function stageCounts(rows) {
  const out = { total: 0, REGISTERED: 0, VERIFIED: 0, PLACED: 0 };
  (rows || []).forEach((r) => {
    out.total += 1;
    if (["REGISTERED", "VERIFIED", "PLACED"].includes(r.stage)) out.REGISTERED += 1;
    if (["VERIFIED", "PLACED"].includes(r.stage)) out.VERIFIED += 1;
    if (r.stage === "PLACED") out.PLACED += 1;
  });
  return out;
}
