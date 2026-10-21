// One place for the words the TPO portal shows for stored values. A raw enum on screen
// ("OFFER_RELEASED", "PLACED_ELSEWHERE") reads like a bug; every list, panel and tag goes through label().

const titleCase = (v) => String(v).replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export const STAGE_LABEL = {
  APPLIED: "Applied", SHORTLISTED: "Shortlisted", ASSESSMENT: "Test", INTERVIEW: "Interview", OFFERED: "Offered",
  HIRED: "Placed", WAITLISTED: "Waitlisted", REJECTED: "Not selected", WITHDRAWN: "Withdrawn",
};

export const DRIVE_STATUS_LABEL = {
  // The five statuses everyone sees (recruiter phase 1, N9). A declined request is Cancelled; nothing is "sent back".
  REQUEST: "Sent for review", SENT_BACK: "Sent for review", REJECTED: "Cancelled", DRAFT: "Draft", PUBLISHED: "Live", LIVE: "Live", CLOSED: "Completed", CANCELLED: "Cancelled",
};

export const OFFER_STATUS_LABEL = {
  RELEASED: "Released", ACCEPTED: "Accepted", DECLINED: "Declined", EXPIRED: "Expired", WITHDRAWN: "Withdrawn",
  VERIFIED: "Verified", PENDING: "Pending", REVERSED: "Reversed", SELECTED: "Selected, not released", PENDING_VERIFICATION: "Waiting to verify",
  REVOKED: "Withdrawn",
};

export const ACTOR_LABEL = { TPO: "Placement team", RECRUITER: "Recruiter", STUDENT: "Student", SYSTEM: "System", COLLEGE_ADMIN: "College admin" };

const TABLES = { stage: STAGE_LABEL, drive: DRIVE_STATUS_LABEL, offer: OFFER_STATUS_LABEL, actor: ACTOR_LABEL };

/** label("stage", "HIRED") -> "Placed". Unknown values fall back to readable text, never the raw constant. */
export function label(kind, value) {
  if (value === null || value === undefined || value === "") return "-";
  const known = TABLES[kind]?.[value];
  return known || titleCase(value);
}

/** An audit/activity row as a sentence-ish phrase: "Round scheduled", not "round_scheduled". */
const ACTION_LABEL = {
  REGISTERED_BY_TPO: "Registration set by the placement cell", REGISTRATION_RESTORED: "Registration put back (undo)",
  RECRUITER_LEADS_RESTORED: "Recruiters put back (undo)", BULK_RUN: "Bulk action", BULK_UNDONE: "Bulk action undone",
  JOB_TYPES_UPDATED: "Job types changed", OUTCOME_LABELS_UPDATED: "Outcome labels changed", SETTINGS_UPDATED: "Settings changed",
  APPLICANTS_MOVED: "Applicants moved", APPLICANTS_NOT_SELECTED: "Applicants not selected", APPLICANTS_MOVE_UNDONE: "Move undone",
  ROUND_RESULTS_APPLIED: "Round results applied", NUDGE_SENT: "Nudge sent", PREP_ASSIGNED: "Prep assigned", RECRUITER_LEADS_OWNER_SET: "Recruiter owner set", RECRUITER_LEADS_STAGE_SET: "Recruiter stage set",
};
export const actionText = (action) => (action ? ACTION_LABEL[action] || titleCase(action) : "Activity");

/** "1 student", "3 students": a count and its noun, so no screen ever says "1 students". */
export const plural = (n, one, many = `${one}s`) => `${n} ${Number(n) === 1 ? one : many}`;
