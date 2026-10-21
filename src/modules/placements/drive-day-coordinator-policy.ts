/**
 * A Drive Day student coordinator receives only same-duty-day rounds,
 * not every round of a job to which they were temporarily assigned.
 * India dates are authoritative for the legacy Drive Day operational view.
 */
/** Legacy scheduled_date is a date-only field. Prefer it if persisted;
 * only use the IST instant when no date-only witness was stored. An absent
 * schedule must never silently become today's coordinator duty. */
export function coordinatorRoundOnDutyDate(input: {
  scheduledAt: Date | null;
  scheduledDate?: string | null;
  roundStatus: string;
  dutyDate: string;
}): boolean {
  const validDay = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const day = new Date(value + "T00:00:00Z");
    return Number.isFinite(day.getTime()) &&
      day.toISOString().slice(0, 10) === value;
  };
  if (!["SCHEDULED", "COMPLETED"].includes(input.roundStatus) ||
      !validDay(input.dutyDate)) return false;
  if (input.scheduledDate !== null && input.scheduledDate !== undefined) {
    return validDay(input.scheduledDate) &&
      input.scheduledDate === input.dutyDate;
  }
  if (!input.scheduledAt ||
      !Number.isFinite(input.scheduledAt.getTime())) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(input.scheduledAt);
  const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return [date.year, date.month, date.day].join("-") === input.dutyDate;
}
