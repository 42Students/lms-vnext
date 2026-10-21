/** Pure helpers for the focused applicant review, kept apart so they can be tested without rendering. */

// HOLD is a waitlist result once the placement cell applies it, so it is called Waitlist here (and H still works as a key).
export const OUTCOMES = {
  PASS: { label: "Shortlist", color: "green", key: "s" },
  HOLD: { label: "Waitlist", color: "gold", key: "w" },
  FAIL: { label: "Reject", color: "red", key: "r" },
  ABSENT: { label: "Absent", color: "default", key: "a" },
};

export const KEY_TO_OUTCOME = { s: "PASS", w: "HOLD", h: "HOLD", r: "FAIL", a: "ABSENT" };

/** A draft belongs to one recruiter at one college on one round: two people on one computer never see each other's. */
export const draftKey = (owner, collegeId, jobId, roundId) => `recruiter-review-draft:${owner ?? "unknown"}:${collegeId}:${jobId}:${roundId}`;

export { safeHref } from "@/utils/safeHref";

/** Drops decisions for people who are no longer on the drive, so one stale entry can never make a whole send fail. */
export function onlyKnownApplicants(decisions, applicants) {
  const known = new Set((applicants || []).map((a) => a.applicantId));
  return Object.fromEntries(Object.entries(decisions || {}).filter(([id]) => known.has(id)));
}

export function readDraft(key) {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

export function writeDraft(key, decisions) {
  try {
    if (!window?.localStorage) return;
    if (!decisions || Object.keys(decisions).length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(decisions));
  } catch (_) { /* a browser that blocks storage just loses the unsent draft */ }
}

/** Counts per outcome for a decisions map ({applicantId: outcome}). */
export function tally(decisions) {
  const out = { PASS: 0, HOLD: 0, FAIL: 0, ABSENT: 0 };
  Object.values(decisions || {}).forEach((o) => { if (out[o] !== undefined) out[o] += 1; });
  return out;
}

/** The rows the results endpoint takes, in the order the applicants were reviewed. */
export function toRows(decisions) {
  return Object.entries(decisions || {}).filter(([, o]) => OUTCOMES[o]).map(([applicantId, outcome]) => ({ applicantId, outcome }));
}

/**
 * Who to review: everyone shared with the recruiter who is not already out of the process, undecided ones first
 * (so a half-finished review resumes where it stopped), the rest after so earlier decisions can still be revisited.
 */
export function reviewQueue(applicants, decisions) {
  const live = (applicants || []).filter((a) => !["REJECTED", "WITHDRAWN", "HIRED"].includes(String(a.stage || "").toUpperCase()));
  const undecided = live.filter((a) => !decisions?.[a.applicantId]);
  const decided = live.filter((a) => decisions?.[a.applicantId]);
  return [...undecided, ...decided];
}

/** Display name from whatever columns the placement cell shared. */
export function applicantName(a) {
  return a?.name || [a?.firstName, a?.lastName].filter(Boolean).join(" ") || a?.applicantId || "Applicant";
}

/** The facts to show on the review card: only columns that were actually shared, in a fixed order. */
// The words the rest of the app uses (UX audit, 19 Oct 2026): "Test", "Placed", "Not selected".
export const STAGE_LABEL = { APPLIED: "Applied", SHORTLISTED: "Shortlisted", ASSESSMENT: "Test", INTERVIEW: "Interview", WAITLISTED: "Waitlisted", OFFERED: "Offered", HIRED: "Placed", REJECTED: "Not selected", WITHDRAWN: "Withdrawn" };

export const FACT_COLUMNS = [
  ["roll", "Roll no."], ["branch", "Branch"], ["cgpa", "UG %"], ["tenth", "10th %"], ["twelfth", "12th / diploma %"],
  ["skillMatch", "Skill match"], ["email", "Email"], ["phone", "Phone"], ["stage", "Stage"],
];

/** Readable headings for whatever columns the placement cell shared (the table showed raw keys like "cgpa"). */
const COLUMN_LABEL = { applicantId: "Applicant ID", name: "Name", firstName: "First name", lastName: "Last name", resume: "Resume", github: "GitHub", portfolio: "Portfolio", passingYear: "Passing year", gender: "Gender" };
export function columnLabel(key) {
  const fact = FACT_COLUMNS.find(([k]) => k === key);
  if (fact) return fact[1];
  if (COLUMN_LABEL[key]) return COLUMN_LABEL[key];
  return String(key).replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function factsOf(a) {
  return FACT_COLUMNS.filter(([k]) => a?.[k] != null && a[k] !== "").map(([k, label]) => ({
    key: k, label, value: k === "skillMatch" ? `${a[k]}%` : k === "stage" ? (STAGE_LABEL[String(a[k]).toUpperCase()] || String(a[k])) : String(a[k]),
  }));
}
