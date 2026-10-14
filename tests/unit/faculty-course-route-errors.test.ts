import { describe, expect, it } from "vitest";
import { CoursesServiceError } from "@/modules/courses/errors";
import { hidesFacultyCourseRouteError } from "@/modules/courses/faculty-course-route-errors";

describe("Faculty course detail private 404 policy", () => {
  it("does not disclose missing or foreign teaching Sections", () => {
    for (const code of ["SECTION_DELIVERY_NOT_FOUND", "OFFERING_NOT_FOUND", "FACULTY_TEACHING_SCOPE_REQUIRED", "LEARNING_ACCESS_DENIED"] as const) {
      expect(hidesFacultyCourseRouteError(new CoursesServiceError(code))).toBe(true);
    }
  });
  it("does not suppress genuine service failures", () => {
    expect(hidesFacultyCourseRouteError(new CoursesServiceError("SCHEDULE_EVENT_CONFLICT"))).toBe(false);
    expect(hidesFacultyCourseRouteError(new Error("database offline"))).toBe(false);
    expect(hidesFacultyCourseRouteError(null)).toBe(false);
  });
});
