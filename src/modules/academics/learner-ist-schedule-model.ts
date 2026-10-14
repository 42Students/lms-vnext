import { z } from "zod";
export function learnerScheduleIstDay(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_CALENDAR_INSTANT");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find(value => value.type === type)!.value;
  return part("year") + "-" + part("month") + "-" + part("day");
}

/** An abstract calendar date, rebuilt in the device timezone for existing grid arithmetic. */
export function learnerScheduleDateFromDay(dayInput: string): Date {
  const day = z.iso.date().parse(dayInput);
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

export function learnerIstScheduleToday(instant: Date): Date {
  return learnerScheduleDateFromDay(learnerScheduleIstDay(instant));
}

/** Calendar cells are abstract days; persisted event instants are always grouped in IST. */
export function eventsForLearnerIstScheduleDay<T extends { startsAt: string }>(
  events: readonly T[], calendarDate: Date,
): T[] {
  const day = calendarDate.getFullYear() + "-" + String(calendarDate.getMonth() + 1).padStart(2, "0") +
    "-" + String(calendarDate.getDate()).padStart(2, "0");
  return events.filter(event => learnerScheduleIstDay(event.startsAt) === day);
}
