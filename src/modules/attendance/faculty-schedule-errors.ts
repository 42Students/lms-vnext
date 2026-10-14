import { CoursesServiceError, postgresConstraintName } from "@/modules/courses/errors";

/** Registered PostgreSQL exclusion constraints remain authoritative; the
 * API translates their conflicts into a retryable 409 instead of a 500. */
export function mapFacultyScheduleInsertError(error: unknown): unknown {
  if (postgresConstraintName(error) === "section_schedule_events_section_no_overlap_excl" ||
      postgresConstraintName(error) === "section_schedule_events_faculty_no_overlap_excl" ||
      postgresConstraintName(error) === "section_schedule_events_hall_no_overlap_excl") {
    return new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
  }
  return error;
}
