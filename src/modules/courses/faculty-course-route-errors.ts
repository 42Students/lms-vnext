import { CoursesServiceError } from "./errors";

/** Map an unassigned/foreign Section and missing delivery to the same 404.
 * Other faults must remain visible to the route error boundary. */
export function hidesFacultyCourseRouteError(error: unknown): boolean {
  return error instanceof CoursesServiceError &&
    (error.code === "SECTION_DELIVERY_NOT_FOUND" ||
      error.code === "OFFERING_NOT_FOUND" ||
      error.code === "FACULTY_TEACHING_SCOPE_REQUIRED" ||
      error.code === "LEARNING_ACCESS_DENIED");
}
