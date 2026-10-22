/**
 * Candidate generation for the two legacy 08:00 IST TPO reminders.
 * This module does NOT dispatch messages or claim a scheduler lease:
 * delivery must still recheck current actor, recipient, opt-out and college
 * scope, use durable idempotency keys, and record a provider receipt.
 */
const dayInIndia = (value: Date): string => {
  if (!Number.isFinite(value.getTime())) throw new Error("INVALID_REMINDER_DATE");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const field = (name: string) => parts.find(part => part.type === name)?.value ?? "";
  return field("year") + "-" + field("month") + "-" + field("day");
};

const nextDay = (day: string): string => {
  const value = new Date(day + "T12:00:00.000Z");
  if (!Number.isFinite(value.getTime()) || value.toISOString().slice(0,10) !== day)
    throw new Error("INVALID_REMINDER_DAY");
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

export type DeadlineTodaySource = {
  collegeId: string;
  jobId: string;
  status: "PUBLISHED" | "DRAFT" | "CLOSED" | "ARCHIVED";
  deletedAt: Date | null;
  applicationDeadline: Date | null;
  /** The caller must load eligible learners through scoped policy evaluation. */
  eligibleMembershipIds: readonly string[];
  appliedMembershipIds: readonly string[];
};

export type ShortlistTomorrowSource = {
  shareId: string;
  collegeId: string;
  recipientEmail: string | null;
  shortlistBy: Date | null;
  revokedAt: Date | null;
  reminderSentOnIstDays: readonly string[];
};

export function generateDeadlineTodayReminderCandidates(
  rows: readonly DeadlineTodaySource[], now: Date,
): { key: string; collegeId: string; jobId: string; membershipId: string }[] {
  const today = dayInIndia(now);
  return rows.flatMap(row => {
    if (row.status !== "PUBLISHED" || row.deletedAt || !row.applicationDeadline ||
        dayInIndia(row.applicationDeadline) !== today) return [];
    const alreadyApplied = new Set(row.appliedMembershipIds);
    return [...new Set(row.eligibleMembershipIds)]
      .filter(id => id !== "" && !alreadyApplied.has(id))
      .map(membershipId => ({
        key: "deadline-today:" + row.jobId + ":" + membershipId + ":" + today,
        collegeId: row.collegeId, jobId: row.jobId, membershipId,
      }));
  });
}

export function generateShortlistDueTomorrowCandidates(
  rows: readonly ShortlistTomorrowSource[], now: Date,
): { key: string; collegeId: string; shareId: string; recipientEmail: string }[] {
  const today = dayInIndia(now);
  const tomorrow = nextDay(today);
  return rows.flatMap(row => {
    if (row.revokedAt || !row.shortlistBy ||
        dayInIndia(row.shortlistBy) !== tomorrow ||
        row.reminderSentOnIstDays.includes(today) ||
        !row.recipientEmail?.trim()) return [];
    return [{
      key: "shortlist-tomorrow:" + row.shareId + ":" + today,
      collegeId: row.collegeId, shareId: row.shareId,
      recipientEmail: row.recipientEmail.trim(),
    }];
  });
}
