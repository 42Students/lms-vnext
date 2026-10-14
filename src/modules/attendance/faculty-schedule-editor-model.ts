import { authoringLocalDateTime, authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";

/** Editor wall times are always IST; persisted values remain UTC instants. */
export function localDateTimeInput(instant: string) {
  return authoringLocalDateTime(instant);
}
export function facultyScheduleInstants(start: string, end: string) {
  if (!start || !end) throw new Error("Choose both a start and an end time.");
  let startsAt: string | null;
  let endsAt: string | null;
  try { startsAt = authoringDueInstant(start); endsAt = authoringDueInstant(end); }
  catch { throw new Error("Enter valid start and end times in IST."); }
  if (!startsAt || !endsAt) throw new Error("Enter valid start and end times in IST.");
  if (new Date(endsAt) <= new Date(startsAt)) throw new Error("The end time must be later than the start time.");
  return {startsAt, endsAt};
}
export function validateFacultyScheduleWindow(start: string, end: string): string | null {
  try { facultyScheduleInstants(start, end); return null; }
  catch (error) { return error instanceof Error ? error.message : "Enter valid start and end times in IST."; }
}
