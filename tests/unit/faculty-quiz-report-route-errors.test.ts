import { describe, expect, it } from "vitest";
import { CoursesServiceError } from "@/modules/courses/errors";
import { hidesFacultyQuizRouteError } from "@/modules/courses/faculty-quiz-report-route-errors";

describe("Faculty Quiz attempt report private 404", () => {
  it("hides nonexistent and unassigned/foreign Quiz identity", () => {
    for (const code of ["QUIZ_NOT_FOUND","QUIZ_DELIVERY_MISMATCH",
      "SECTION_DELIVERY_NOT_FOUND","FACULTY_TEACHING_SCOPE_REQUIRED",
      "LEARNING_ACCESS_DENIED"] as const) {
      expect(hidesFacultyQuizRouteError(new CoursesServiceError(code))).toBe(true);
    }
  });
  it("preserves real lifecycle and database error reporting", () => {
    expect(hidesFacultyQuizRouteError(new CoursesServiceError("FACULTY_QUIZ_STALE_VERSION"))).toBe(false);
    expect(hidesFacultyQuizRouteError(new Error("database failed"))).toBe(false);
  });
});
