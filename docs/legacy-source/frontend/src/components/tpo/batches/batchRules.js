// Batches and eligibility: the words, the journey and the "one next step" (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md).
import { academicFilterDefs } from "@/components/tpo/students/academics";
import { FALLBACK_CHOICES, OUTCOMES } from "@/config/choices";

export const DECISION = {
  ELIGIBLE: { label: "Eligible", color: "green", status: "active", tone: "success" },
  INELIGIBLE: { label: "Ineligible", color: "red", status: "failed", tone: "error" },
  NOT_DECIDED: { label: "Not decided", color: "default", status: "pending", tone: "warning" },
};
export const decisionLabel = (s) => (DECISION[s] || DECISION.NOT_DECIDED).label;

/** Where a student's decision comes from, in words. */
export const LEVEL_TEXT = { LEARNER: "own decision", CLASS: "from class", BATCH: "from batch" };
export const levelText = (level) => LEVEL_TEXT[level] || "";

export const STATE = {
  IN_PLACEMENTS: { label: "In placements", color: "green", status: "active", tone: "success" },
  NOT_STARTED: { label: "Not started", color: "default", status: "draft", tone: "neutral" },
  FINISHED: { label: "Finished", color: "purple", status: "closed", tone: "neutral" },
};

/** Quick reasons for Ineligible. "Other" lets the TPO type one. */
export const INELIGIBLE_REASONS = [
  "Higher studies", "Not interested in placements", "Detained / year back", "Discontinued", "Disciplinary", "Already has a job",
];

const n = (v) => Number(v) || 0;

/** The batch journey: Eligible → Invited → Registered → Verified → Placed. */
export function journey(b) {
  return [
    { key: "eligible", label: "Eligible", value: n(b.eligible) },
    // Each step includes the later ones, like the batch page's strip: a student who registered has passed "Invited".
    { key: "invited", label: "Invited", value: Math.max(n(b.invited), n(b.registered)) },
    { key: "registered", label: "Registered", value: n(b.registered) },
    { key: "verified", label: "Verified", value: n(b.verified) },
    { key: "placed", label: "Placed", value: n(b.placed) },
  ];
}

/** Years of a batch for its card, e.g. "2023–27". */
export function batchYears(b) {
  const y = (d) => (d ? String(d).slice(0, 4) : "");
  const from = y(b.startDate); const to = y(b.endDate);
  if (from && to) return `${from}–${to.slice(2)}`;
  return from || to || b.academicYear || "";
}

/**
 * The one next step for a batch card: what the placement cell should do now.
 * Returns { key, label, href? } — href is relative to the batch page unless absolute.
 */
export function nextStep(b) {
  const students = n(b.students); const eligible = n(b.eligible); const notDecided = n(b.notDecided);
  if (b.state === "FINISHED") return { key: "view", label: "View batch", tab: "students" };
  if (students === 0) return { key: "empty", label: "Add students in Academic Setup", disabled: true };
  if (eligible === 0) return { key: "decide", label: notDecided === students ? "Decide who is in placements" : "Review decisions", tab: "students" };
  // Only the eligible students who haven't registered yet need inviting (the same number Home and the batch page show).
  if (!b.invitedAt) return { key: "invite", label: `Invite ${Math.max(0, eligible - n(b.registered)).toLocaleString()} to register`, tab: "students" };
  if (n(b.registered) < eligible) return { key: "remind", label: `${(eligible - n(b.registered)).toLocaleString()} still to register`, tab: "students" };
  if (n(b.verified) < n(b.registered)) return { key: "verify", label: `Verify ${(n(b.registered) - n(b.verified)).toLocaleString()} profiles`, href: "/tpo/verification" };
  return { key: "drives", label: "Add them to a drive", href: "/tpo/drives" };
}

/** Counts of a list of students: shown, eligible, ineligible, not decided. */
export function decisionCounts(rows) {
  const out = { total: 0, ELIGIBLE: 0, INELIGIBLE: 0, NOT_DECIDED: 0 };
  (rows || []).forEach((r) => { out.total += 1; out[DECISION[r.eligibility] ? r.eligibility : "NOT_DECIDED"] += 1; });
  return out;
}

/** The change list for a bulk decision on selected students. status null = back to following the class/batch. */
export const learnerChanges = (rows, status, reason) => (rows || []).map((r) => ({
  scopeType: "LEARNER", scopeId: r.learnerId, status, reason: status === "INELIGIBLE" ? reason : undefined,
}));

/** Students of the selection whose own decision would actually change (so the button can say how many). */
export function wouldChange(rows, status, reason) {
  return (rows || []).filter((r) => {
    const own = r.ownDecision || null;
    if (own !== status) return true;
    return status === "INELIGIBLE" && (r.ownReason || "") !== (reason || "");
  }).length;
}

// ---- A batch's road into placements (docs/tpo-ux: batch page best version) -------------------------------------------------
// The batch page owns getting students in: decided, invited, registered. What happens after registration lives on Students.
/** A student's stage on the batch sheet: not in placements until Eligible, then the Students page's stage. */
export const BATCH_STAGE = {
  NOT_IN: { label: "Not in placements", color: "default", status: "closed", tone: "neutral" },
  ELIGIBLE: { label: "Not invited", color: "default", status: "pending", tone: "warning" },
  INVITED: { label: "Invited", color: "blue", status: "scheduled", tone: "info" },
  REGISTERED: { label: "Registered", color: "geekblue", status: "submitted", tone: "info" },
  VERIFIED: { label: "Verified", color: "cyan", status: "evaluated", tone: "success" },
  PLACED: { label: "Placed", color: "green", status: "evaluated", tone: "success" },
};
export const batchStage = (r) => (r.eligibility !== "ELIGIBLE" ? "NOT_IN" : r.placed ? "PLACED" : r.stage && BATCH_STAGE[r.stage] ? r.stage : r.registered ? "REGISTERED" : "ELIGIBLE");
const inOf = (r) => r.eligibility === "ELIGIBLE";
const regOf = (r) => inOf(r) && ["REGISTERED", "VERIFIED", "PLACED"].includes(batchStage(r));
/** invited: whether the batch has been invited (registration opened). */
export const batchJourney = (invited) => [
  { key: "B_ALL", label: "Students", step: true, test: () => true },
  { key: "B_ELIGIBLE", label: "Eligible", step: true, test: inOf },
  // Each step holds the next: a student who registered without an invite (applied, or set by the placement cell) has passed it.
  { key: "B_INVITED", label: "Invited", step: true, test: (r) => inOf(r) && (invited || regOf(r)) },
  { key: "B_REGISTERED", label: "Registered", step: true, test: regOf },
  { key: "B_GAP_UNDECIDED", label: "Not decided", after: "B_ALL", test: (r) => (r.eligibility || "NOT_DECIDED") === "NOT_DECIDED" },
  { key: "B_GAP_NOT_INVITED", label: "Not invited", after: "B_ELIGIBLE", test: (r) => inOf(r) && !invited && !regOf(r) },
  { key: "B_GAP_NOT_REGISTERED", label: "Not registered", after: "B_INVITED", test: (r) => inOf(r) && invited && !regOf(r) },
  { key: "B_INELIGIBLE", label: "Ineligible", extra: true, test: (r) => r.eligibility === "INELIGIBLE" },
  // Shown in the "Who is in" block, not beside the strip; still a journey filter so it is a chip.
  { key: "B_OWN", label: "Decided individually", test: (r) => Boolean(r.ownDecision) },
  { key: "B_NO_RESUME", label: "No resume", extra: true, test: (r) => inOf(r) && r.hasResume === false },
];

/** Filter definitions for the eligibility grid's side panel (see filters/filterModel). classes: [{ classId, name }]. */
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
export const gridFilterDefs = (classes, invited = false) => [
  {
    group: "Decision", key: "class", label: "Class", type: "checklist", get: (r) => (r.classId === null || r.classId === undefined ? "" : String(r.classId)),
    options: (classes || []).map((c) => ({ value: String(c.classId), label: c.name })),
  },
  {
    group: "Decision", key: "decision", label: "Decision", type: "checklist", get: (r) => r.eligibility || "NOT_DECIDED",
    options: [{ value: "ELIGIBLE", label: "Eligible" }, { value: "INELIGIBLE", label: "Ineligible" }, { value: "NOT_DECIDED", label: "Not decided" }],
  },
  {
    group: "Decision", key: "level", label: "Decided on", type: "checklist", get: (r) => r.eligibilityLevel || "NONE",
    options: [{ value: "LEARNER", label: "The student" }, { value: "CLASS", label: "Their class" }, { value: "BATCH", label: "The batch" }, { value: "NONE", label: "Nothing yet" }],
  },
  {
    group: "Decision", key: "own", label: "Student's own", type: "checklist", get: (r) => r.ownDecision || "FOLLOW",
    options: [{ value: "FOLLOW", label: "Follows class" }, { value: "ELIGIBLE", label: "Eligible" }, { value: "INELIGIBLE", label: "Ineligible" }],
  },
  { group: "Decision", key: "branch", label: "Branch", type: "checklist", get: (r) => r.branch || "Not set" },
  // The strip at the top (panel: false): a step, a gap or a link, shown as a chip.
  { group: "Decision", key: "bjourney", label: "Journey", type: "checklist", panel: false, get: (r) => batchJourney(invited).filter((j) => j.key !== "B_ALL" && j.test(r)).map((j) => j.key),
    options: batchJourney(invited).filter((j) => j.key !== "B_ALL").map((j) => ({ value: j.key, label: j.label })) },
  { group: "Progress", key: "stage", label: "Stage", type: "checklist", get: batchStage, options: Object.entries(BATCH_STAGE).map(([value, v]) => ({ value, label: v.label })) },
  { group: "Progress", key: "outcome", label: "After college", type: "checklist", get: (r) => r.outcome || "NOT_REGISTERED", options: OUTCOMES.map((o) => ({ value: o.value, label: o.label })) },
  { group: "Progress", key: "registered", label: "Registered", type: "yesno", get: (r) => Boolean(r.registered) },
  { group: "Progress", key: "verified", label: "Profile verified", type: "yesno", get: (r) => Boolean(r.profileVerified) },
  { group: "Progress", key: "placed", label: "Placed", type: "yesno", get: (r) => Boolean(r.placed) },
  ...academicFilterDefs("Academics"),
  { group: "Profile strength", key: "resume", label: "Resume", type: "yesno", get: (r) => Boolean(r.hasResume), yes: "Uploaded", no: "Missing",
    chip: (v) => (v === "no" ? "No resume" : "Resume uploaded") },
  { group: "Profile strength", key: "skills", label: "Skills", type: "checklist", get: (r) => r.skills || [] },
  { group: "Profile strength", key: "projectsCount", label: "Projects", type: "range", get: (r) => num(r.projectsCount) ?? 0, min: 0 },
  { group: "Profile strength", key: "certificationsCount", label: "Certifications", type: "range", get: (r) => num(r.certificationsCount) ?? 0, min: 0 },
  { group: "Profile strength", key: "links", label: "Profile links", type: "checklist",
    get: (r) => { const l = [r.hasGithub && "GITHUB", r.hasLinkedin && "LINKEDIN", r.hasPortfolio && "PORTFOLIO"].filter(Boolean); return l.length ? l : ["NONE"]; },
    options: [{ value: "GITHUB", label: "GitHub" }, { value: "LINKEDIN", label: "LinkedIn" }, { value: "PORTFOLIO", label: "Portfolio" }, { value: "NONE", label: "None added" }] },
  { group: "Profile strength", key: "coding", label: "Coding profiles", type: "checklist", get: (r) => (r.codingPlatforms?.length ? r.codingPlatforms : ["NONE"]),
    options: [...FALLBACK_CHOICES.codingPlatforms.map((pl) => ({ value: pl.value, label: pl.label })), { value: "NONE", label: "None added" }] },
  { group: "Drives so far", key: "applications", label: "Applications", type: "range", get: (r) => Number(r.applications ?? 0), min: 0 },
  { group: "Drives so far", key: "offers", label: "Offers", type: "range", get: (r) => Number(r.offers ?? 0), min: 0 },
  { group: "Person", key: "gender", label: "Gender", type: "checklist", get: (r) => r.gender || "Not given" },
];

/** Batches page filters. Finished batches are hidden unless the State filter asks for them. */
export const batchFilterDefs = [
  { key: "state", label: "State", type: "checklist", get: (b) => b.state,
    options: [{ value: "IN_PLACEMENTS", label: "In placements" }, { value: "NOT_STARTED", label: "Not started" }, { value: "FINISHED", label: "Finished" }] },
  { key: "department", label: "Department", type: "checklist", get: (b) => b.department || "-" },
  { key: "program", label: "Program", type: "checklist", get: (b) => b.program || "-" },
  { key: "endYear", label: "Final year", type: "checklist", get: (b) => (b.endDate ? String(b.endDate).slice(0, 4) : "Not set") },
];

/** A batch whose course has ended and that never went into placements (e.g. a 2024-25 batch in 2026): nothing to decide. */
export const isPassedOutUnused = (b, today = new Date()) =>
  b.state === "NOT_STARTED" && Boolean(b.endDate) && String(b.endDate).slice(0, 10) < today.toISOString().slice(0, 10);

/** The batches a page works with by default: not finished, and not passed out without ever being in placements. Filtering by
 *  state shows them all. */
export const isWorkingBatch = (b) => b.state !== "FINISHED" && !isPassedOutUnused(b);
export const visibleBatches = (batches, state) => (state?.state?.length ? batches : (batches || []).filter(isWorkingBatch));
