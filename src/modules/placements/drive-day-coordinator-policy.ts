/**
 * A Drive Day student coordinator receives only same-duty-day rounds,
 * not every round of a job to which they were temporarily assigned.
 * India dates are authoritative for the legacy Drive Day operational view.
 */
export function coordinatorRoundOnDutyDate(input: {
  scheduledAt: Date | null;
  roundStatus: string;
  dutyDate: string;
}): boolean {
  if (!input.scheduledAt ||
      !["SCHEDULED", "COMPLETED"].includes(input.roundStatus) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.dutyDate)) {
    return false;
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(input.scheduledAt);
  const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return [date.year, date.month, date.day].join("-") === input.dutyDate;
}
