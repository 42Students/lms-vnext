import { authoringLocalDateTime, authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";

/** Editor wall times are always IST; persisted values remain UTC instants. */
export function localDateTimeInput(instant: string) {
  return authoringLocalDateTime(instant);
}
export function facultyScheduleInstants(start: string, end: string, original?: {startsAt:string;endsAt:string}) {
  if (!start || !end) throw new Error("Choose both a start and an end time.");
  let startsAt: string | null;
  let endsAt: string | null;
  try {
    startsAt = original && start === localDateTimeInput(original.startsAt)
      ? new Date(original.startsAt).toISOString() : authoringDueInstant(start);
    endsAt = original && end === localDateTimeInput(original.endsAt)
      ? new Date(original.endsAt).toISOString() : authoringDueInstant(end);
  }
  catch { throw new Error("Enter valid start and end times in IST."); }
  if (!startsAt || !endsAt) throw new Error("Enter valid start and end times in IST.");
  if(new Date(endsAt)<=new Date(startsAt))throw new Error("End time must be after start time");
  // Rescheduling an already-existing past session is handled by the service's
  // separate correction authority, never by relaxing create validation here.
  if(!original&&new Date(startsAt).getTime()<Date.now())
    throw new Error("Start time cannot be in the past.");
  if(new Date(endsAt).getTime()-new Date(startsAt).getTime()>12*60*60*1000)
    throw new Error("A class can be at most 12 hours. Check AM/PM.");
  return {startsAt, endsAt};
}
export function validateFacultyScheduleWindow(start: string, end: string, original?: {startsAt:string;endsAt:string}): string | null {
  try { facultyScheduleInstants(start, end, original); return null; }
  catch (error) { return error instanceof Error ? error.message : "Enter valid start and end times in IST."; }
}
