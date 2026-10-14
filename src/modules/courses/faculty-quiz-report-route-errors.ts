import { CoursesServiceError } from "./errors";

/** A missing, foreign or ambiguous Quiz must be indistinguishable at the
 * browser route, while system errors still propagate to the error boundary. */
export function hidesFacultyQuizRouteError(error: unknown): boolean {
  return error instanceof CoursesServiceError &&
    (error.code === "QUIZ_NOT_FOUND" ||
     error.code === "QUIZ_DELIVERY_MISMATCH" ||
     error.code === "SECTION_DELIVERY_NOT_FOUND" ||
     error.code === "FACULTY_TEACHING_SCOPE_REQUIRED" ||
     error.code === "LEARNING_ACCESS_DENIED");
}
