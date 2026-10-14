import type { PlacementCalendarEvent } from "./placement-calendar-model";
export type RecruiterTodayJob = {
  collegeId: string;
  job: { id: string; title: string; status: string; archivedAt: Date | null; applicationDeadline: Date | null };
};
const DAY = 86400000;

/** A seven-calendar-day outlook anchored to the date in India, not UTC midnight. */
export function recruiterTodayWeek(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value ?? "0");
  const utc = Date.UTC(value("year"), value("month") - 1, value("day"));
  const date = (delta: number) => new Date(utc + delta * DAY).toISOString().slice(0,10);
  return {from: date(0), to: date(6)};
}

export function buildRecruiterToday<T extends RecruiterTodayJob>(
  jobs: readonly T[], events: readonly PlacementCalendarEvent[],
  collegeId: string, now: Date,
) {
  const scoped = jobs.filter(item => item.collegeId === collegeId &&
    item.job.archivedAt === null && (item.job.status === "PUBLISHED" || item.job.status === "CLOSED"));
  const allowed = new Set(scoped.map(item => item.job.id));
  const dueSoon = scoped.filter(item =>
    item.job.status === "PUBLISHED" && item.job.applicationDeadline !== null &&
    item.job.applicationDeadline.getTime() >= now.getTime() &&
    item.job.applicationDeadline.getTime() <= now.getTime() + 7 * DAY,
  ).sort((a,b) => a.job.applicationDeadline!.getTime() - b.job.applicationDeadline!.getTime());
  const upcomingRounds = events.filter(event =>
    event.kind === "ROUND" && event.status === "SCHEDULED" &&
    event.jobId !== null && allowed.has(event.jobId) &&
    event.startsAt.getTime() >= now.getTime(),
  ).sort((a,b) => a.startsAt.getTime() - b.startsAt.getTime());
  return {
    live: scoped.filter(item => item.job.status === "PUBLISHED").length,
    closed: scoped.filter(item => item.job.status === "CLOSED").length,
    dueSoon, upcomingRounds,
  };
}
