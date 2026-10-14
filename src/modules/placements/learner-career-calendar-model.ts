import { isCareerRoundVisible } from "./learner-round-visibility-policy";

export type CareerCalendarSourceRound = {
  applicationId: string;
  roundId: string;
  roundName: string;
  roundKind: string;
  companyName: string;
  roleTitle: string;
  scheduledAt: string | null;
  exception: { scheduledAt: string } | null;
};

export type CareerCalendarEvent = {
  key: string;
  applicationId: string;
  roundId: string;
  title: string;
  companyName: string;
  roleTitle: string;
  kind: "ASSESSMENT" | "INTERVIEW" | "OTHER";
  start: Date;
  dayKey: string;
  rescheduled: boolean;
};

export type CareerCalendarView = "agenda" | "month" | "week" | "day";

export function careerDayKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const get = (part: string) => parts.find((row) => row.type === part)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function initialCareerCalendarDay(): string {
  return careerDayKey(new Date());
}

function dateUtc(key: string) {
  return new Date(key + "T12:00:00.000Z");
}

export function shiftCareerCalendarDay(
  dayKey: string, view: CareerCalendarView, step: number,
): string {
  const value = dateUtc(dayKey);
  if (view === "agenda") value.setUTCDate(value.getUTCDate() + step * 30);
  else if (view === "week") value.setUTCDate(value.getUTCDate() + step * 7);
  else if (view === "day") value.setUTCDate(value.getUTCDate() + step);
  else {
    const initialDay = value.getUTCDate();
    value.setUTCDate(1);
    value.setUTCMonth(value.getUTCMonth() + step);
    const lastDay = new Date(Date.UTC(
      value.getUTCFullYear(), value.getUTCMonth() + 1, 0,
    )).getUTCDate();
    value.setUTCDate(Math.min(initialDay, lastDay));
  }
  return value.toISOString().slice(0, 10);
}

export function careerCalendarEvents(
  rounds: readonly CareerCalendarSourceRound[],
): CareerCalendarEvent[] {
  return rounds.flatMap((round) => {
    const raw = round.exception?.scheduledAt ?? round.scheduledAt;
    if (!raw) return [];
    const start = new Date(raw);
    if (!Number.isFinite(start.getTime())) return [];
    const kind: CareerCalendarEvent["kind"] = isCareerRoundVisible("ASSESSMENT", round.roundKind)
      ? "ASSESSMENT" : isCareerRoundVisible("INTERVIEW", round.roundKind)
        ? "INTERVIEW" : "OTHER";
    return [{
      key: `${round.applicationId}:${round.roundId}`,
      applicationId: round.applicationId,
      roundId: round.roundId,
      title: round.roundName,
      companyName: round.companyName,
      roleTitle: round.roleTitle,
      kind,
      start,
      dayKey: careerDayKey(start),
      rescheduled: round.exception !== null,
    }];
  }).sort((a,b) => a.start.getTime() - b.start.getTime() || a.key.localeCompare(b.key));
}

export function careerCalendarPeriod(
  events: readonly CareerCalendarEvent[],
  anchor: string, view: CareerCalendarView,
) {
  const date = dateUtc(anchor);
  let start: string, end: string;
  if (view === "day") {
    start = end = anchor;
  } else if (view === "agenda") {
    start = anchor;
    date.setUTCDate(date.getUTCDate() + 29);
    end = date.toISOString().slice(0, 10);
  } else if (view === "week") {
    const offset = (date.getUTCDay() + 6) % 7; // ISO Monday
    date.setUTCDate(date.getUTCDate() - offset);
    start = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 6);
    end = date.toISOString().slice(0, 10);
  } else {
    start = anchor.slice(0, 7) + "-01";
    date.setUTCMonth(date.getUTCMonth() + 1, 0);
    end = date.toISOString().slice(0, 10);
  }
  return {
    start, end,
    events: events.filter((event) => event.dayKey >= start && event.dayKey <= end),
  };
}

function icalText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,").replace(/;/g, "\\;");
}
function icalInstant(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Export only authenticated learner-visible round titles/dates.
 * Don't leak provider URLs, invite secrets, or invent interview durations.
 */
export function learnerCareerIcal(
  events: readonly CareerCalendarEvent[], issuedAt: Date,
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//42Students LMS//Learner Career Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const event of events) {
    const uid = event.key.replace(/[^a-zA-Z0-9:-]/g, "") + "@42students.lms";
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + icalInstant(issuedAt),
      "DTSTART:" + icalInstant(event.start),
      "SUMMARY:" + icalText(event.title + " · " + event.companyName),
      "DESCRIPTION:" + icalText(event.roleTitle + (event.rescheduled ? " (rescheduled)" : "")),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
