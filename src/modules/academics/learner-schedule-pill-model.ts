/**
 * Legacy Class Schedule header pills (ClassScheduleContent.jsx): "{n} today"
 * and "Next: {time}" with the (shortened) course name as the popover title.
 * Pure and IST based so the server and the browser print the same text.
 */
const IST = "Asia/Kolkata";

export type LearnerSchedulePillEvent = {
  startsAt: string;
  courseName?: string | null;
  title?: string | null;
};

function istDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function istClock(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()}`;
}

function istWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: IST, weekday: "short" }).format(date);
}

export function learnerScheduleNextPillValue(startsAt: string, now: Date) {
  const start = new Date(startsAt);
  const key = istDateKey(start);
  if (key === istDateKey(now)) return istClock(start);
  if (key === istDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000))) {
    return `Tomorrow ${istClock(start)}`;
  }
  return `${istWeekday(start)} ${istClock(start)}`;
}

export function learnerScheduleShortCourseName(event: LearnerSchedulePillEvent) {
  const name = event.courseName || event.title || "Class";
  return name.length > 18 ? `${name.slice(0, 16)}…` : name;
}

export function learnerSchedulePills(input: {
  todayCount: number;
  next: LearnerSchedulePillEvent | null;
  now: Date;
}) {
  if (input.todayCount <= 0 && !input.next) return null;
  return {
    today: `${input.todayCount} today`,
    next: input.next
      ? {
          label: `Next: ${learnerScheduleNextPillValue(input.next.startsAt, input.now)}`,
          popoverTitle: learnerScheduleShortCourseName(input.next),
        }
      : null,
  };
}
