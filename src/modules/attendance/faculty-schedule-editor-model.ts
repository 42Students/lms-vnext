import { authoringLocalDateTime, authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";

/** Editor wall times are always IST; persisted values remain UTC instants.
 * The authenticated delivery route owns the faculty/class assignment; it must
 * never accept client-supplied faculty or class identifiers. An optional hall
 * is represented by location in the current delivery editor, not by an
 * unvalidated foreign-college lectureHallId. */
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
  catch { throw new Error("Invalid start or end time format. Use yyyy-MM-dd HH:mm:ss"); }
  if (!startsAt || !endsAt) throw new Error("Invalid start or end time format. Use yyyy-MM-dd HH:mm:ss");
  if(new Date(endsAt)<=new Date(startsAt))throw new Error("Schedule start time must be before end time (End time must be after start time)");
  // Rescheduling an already-existing past session is handled by the service's
  // separate correction authority, never by relaxing create validation here.
  if(!original&&new Date(startsAt).getTime()<Date.now())
    throw new Error("Cannot schedule a class in the past");
  if(new Date(endsAt).getTime()-new Date(startsAt).getTime()>12*60*60*1000)
    throw new Error("A single class session cannot exceed 12 hours");
  return {startsAt, endsAt};
}
export function validateFacultyScheduleWindow(start: string, end: string, original?: {startsAt:string;endsAt:string}): string | null {
  try { facultyScheduleInstants(start, end, original); return null; }
  catch (error) { return error instanceof Error ? error.message : "Invalid start or end time format. Use yyyy-MM-dd HH:mm:ss"; }
}
