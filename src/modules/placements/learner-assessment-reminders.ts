/** Personal browser reminder only; never an employer submission record. */
export type LearnerAssessmentReminders = Record<string, string>;
const PREFIX = "lms:learner:assessment-reminders:v1";
const MAX_ENTRIES = 200;

export function learnerAssessmentReminderStorageKey(membershipId: string): string {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(membershipId)) {
    throw new Error("INVALID_MEMBERSHIP_ID");
  }
  return PREFIX + ":" + membershipId;
}

export function learnerAssessmentReminderId(applicationId: string, roundId: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(applicationId) ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(roundId)) {
    throw new Error("INVALID_ASSESSMENT_REMINDER_ID");
  }
  return applicationId + ":" + roundId;
}

export function parseLearnerAssessmentReminders(
  raw: string | null,
): LearnerAssessmentReminders {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const record: LearnerAssessmentReminders = Object.create(null);
    for (const [key, value] of Object.entries(parsed).slice(0, MAX_ENTRIES)) {
      if (!/^[a-zA-Z0-9_-]{1,128}:[a-zA-Z0-9_-]{1,128}$/.test(key)) continue;
      if (typeof value !== "string" || value.length > 40) continue;
      const instant = Date.parse(value);
      if (!Number.isFinite(instant) || new Date(instant).toISOString() !== value) continue;
      record[key] = value;
    }
    return record;
  } catch {
    return {};
  }
}

export function toggleLearnerAssessmentReminder(
  current: Readonly<LearnerAssessmentReminders>,
  id: string,
  nowIso: string,
): LearnerAssessmentReminders {
  if (!/^[a-zA-Z0-9_-]{1,128}:[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    throw new Error("INVALID_ASSESSMENT_REMINDER_ID");
  }
  const next = { ...current };
  if (next[id]) {
    delete next[id];
  } else {
    const instant = Date.parse(nowIso);
    if (!Number.isFinite(instant) || new Date(instant).toISOString() !== nowIso) {
      throw new Error("INVALID_REMINDER_TIMESTAMP");
    }
    next[id] = nowIso;
  }
  return next;
}
