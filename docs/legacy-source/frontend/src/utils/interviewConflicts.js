import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

/**
 * Shared interview conflict-detection logic.
 *
 * Originally lived only inside InterviewCalendarContent.js (read-only calendar view), where it
 * powered the red "Conflict" tag after the fact. Extracted here so InterviewForm.js (create) and
 * InterviewEditForm.js (edit) can warn an admin about a double-booking *before* they submit,
 * instead of the conflict only surfacing later on the calendar.
 */

// Only interviews still "live" can conflict with anything — a cancelled/completed slot can't.
const ACTIVE_STATUSES = ["SCHEDULED", "CONFIRMED", "RESCHEDULE_REQUESTED"];

// Must match OVERLAP_BUFFER_MINUTES in InterviewServiceImpl.java (hasOverlap(), ~line 303 in the
// backend repo at lms-dev-2026-backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java).
// The backend adds this buffer to the end of BOTH interviews being compared before checking overlap,
// so it rejects anything scheduled within 15 minutes of an existing interview's end. If this drifts
// out of sync, the frontend's "soft" warning will miss cases the backend hard-rejects with a 400.
const OVERLAP_BUFFER_MINUTES = 15;

function overlaps(aStart, aDurationMinutes, bStart, bDurationMinutes) {
  const a = parsePlacementUtcDateTime(aStart);
  const b = parsePlacementUtcDateTime(bStart);
  if (!a || !b) return false;
  const aStartMs = a.valueOf();
  const bStartMs = b.valueOf();
  const aEnd = aStartMs + ((Number(aDurationMinutes) || 60) + OVERLAP_BUFFER_MINUTES) * 60000;
  const bEnd = bStartMs + ((Number(bDurationMinutes) || 60) + OVERLAP_BUFFER_MINUTES) * 60000;
  return aStartMs < bEnd && bStartMs < aEnd;
}

export function getActiveInterviews(interviews) {
  return (interviews || []).filter(
    (inv) => ACTIVE_STATUSES.includes(inv?.interviewStatus) && inv?.scheduledDate
  );
}

/**
 * Computes the interview ids involved in a scheduling conflict across the full list — used by
 * InterviewCalendarContent.js to flag rows with a "Conflict" tag.
 *
 * Two kinds of conflicts are detected, both scoped to overlapping time windows:
 *  - the same learner double-booked (across any company/drive)
 *  - the same interviewer (scoped to companyName, so two different people who share a name but
 *    interview for different companies are never falsely flagged against each other)
 *
 * Returns a Map<interviewId, Set<"learner"|"interviewer">> rather than a plain Set of ids — an
 * id can appear in both. Cosmetic fix (audit L4): the "N conflicts" tag/quick-filter previously
 * couldn't tell an admin which kind of conflict a row had (same candidate double-booked vs. same
 * interviewer double-booked) without opening the row; a Map lets callers render/label each kind.
 * `.has(id)` and `.size` (used by existing callers for "any conflict at all" / total count) work
 * identically on a Map as they did on the old Set.
 */
export function computeConflictIds(interviews) {
  const conflicts = new Map();
  const flag = (id, kind) => {
    if (!conflicts.has(id)) conflicts.set(id, new Set());
    conflicts.get(id).add(kind);
  };
  const active = getActiveInterviews(interviews);

  const groupAndFlag = (keyFn, kind) => {
    const groups = new Map();
    active.forEach((inv) => {
      const key = keyFn(inv);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(inv);
    });
    groups.forEach((group) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (
            overlaps(
              group[i].scheduledDate,
              group[i].durationMinutes,
              group[j].scheduledDate,
              group[j].durationMinutes
            )
          ) {
            flag(group[i].id, kind);
            flag(group[j].id, kind);
          }
        }
      }
    });
  };

  groupAndFlag((inv) => inv.learner?.id, "learner");
  groupAndFlag((inv) => {
    const name = (inv.interviewerName || "").trim().toLowerCase();
    if (!name) return null;
    const company = (inv.job?.companyName || "").trim().toLowerCase();
    return `${company}::${name}`;
  }, "interviewer");

  return conflicts;
}

/** Human-readable label for a conflict-kind Set, e.g. from computeConflictIds().get(id). */
export function describeConflictKinds(kinds) {
  if (!kinds || kinds.size === 0) return "Conflict";
  const hasLearner = kinds.has("learner");
  const hasInterviewer = kinds.has("interviewer");
  if (hasLearner && hasInterviewer) return "Candidate & interviewer conflict";
  if (hasLearner) return "Candidate double-booked";
  if (hasInterviewer) return "Interviewer double-booked";
  return "Conflict";
}

/**
 * Checks a single candidate interview (being created or edited) against a list of existing
 * interviews and returns the ones it conflicts with. Used by InterviewForm.js / InterviewEditForm.js
 * to show an inline warning before/at submit time.
 *
 * @param {Array} existingInterviews - full list of interviews to check against (e.g. for the org)
 * @param {Object} candidate
 * @param {number} [candidate.id] - id of the interview being edited, excluded from the comparison
 * @param {number} [candidate.learnerId] - candidate's learner id
 * @param {string} [candidate.companyName] - company for this interview (scopes interviewer matches)
 * @param {string} [candidate.interviewerName] - interviewer(s) for this interview
 * @param {string} candidate.scheduledDate - ISO datetime of the candidate slot
 * @param {number} [candidate.durationMinutes] - defaults to 60 if not provided
 * @returns {Array} the conflicting interviews from existingInterviews (deduped)
 */
export function findConflictingInterviews(existingInterviews, candidate) {
  if (!candidate?.scheduledDate) return [];
  const active = getActiveInterviews(existingInterviews).filter(
    (inv) => candidate.id == null || inv.id !== candidate.id
  );

  const learnerConflicts = candidate.learnerId
    ? active.filter(
        (inv) =>
          inv.learner?.id === candidate.learnerId &&
          overlaps(inv.scheduledDate, inv.durationMinutes, candidate.scheduledDate, candidate.durationMinutes)
      )
    : [];

  const interviewerName = (candidate.interviewerName || "").trim().toLowerCase();
  const company = (candidate.companyName || "").trim().toLowerCase();
  const interviewerConflicts = interviewerName
    ? active.filter((inv) => {
        const name = (inv.interviewerName || "").trim().toLowerCase();
        if (name !== interviewerName) return false;
        const invCompany = (inv.job?.companyName || "").trim().toLowerCase();
        if (invCompany !== company) return false;
        return overlaps(inv.scheduledDate, inv.durationMinutes, candidate.scheduledDate, candidate.durationMinutes);
      })
    : [];

  const seen = new Set();
  return [...learnerConflicts, ...interviewerConflicts].filter((inv) => {
    if (seen.has(inv.id)) return false;
    seen.add(inv.id);
    return true;
  });
}
