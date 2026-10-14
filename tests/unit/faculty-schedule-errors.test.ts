import { describe, expect, it } from "vitest";
import { CoursesServiceError } from "@/modules/courses/errors";
import { mapFacultyScheduleInsertError } from "@/modules/attendance/faculty-schedule-errors";

describe("Faculty class scheduling PostgreSQL errors", () => {
  it("maps overlapping Section, Faculty and room exclusion violations to a domain conflict", () => {
    for (const name of [
      "section_schedule_events_section_no_overlap_excl",
      "section_schedule_events_faculty_no_overlap_excl",
      "section_schedule_events_hall_no_overlap_excl",
    ]) {
      const error = { cause: { cause: { constraint: name } } };
      expect(mapFacultyScheduleInsertError(error)).toMatchObject({
        name: "CoursesServiceError", code: "SCHEDULE_EVENT_CONFLICT",
      });
      expect(mapFacultyScheduleInsertError(error)).toBeInstanceOf(CoursesServiceError);
    }
  });
  it("does not swallow unexpected database failures or permission errors", () => {
    const unknown = new Error("disconnected");
    expect(mapFacultyScheduleInsertError(unknown)).toBe(unknown);
    const denied = new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
    expect(mapFacultyScheduleInsertError(denied)).toBe(denied);
  });
});
