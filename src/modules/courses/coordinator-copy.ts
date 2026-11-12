/** Plain-language messages for the course coordinator screens. Safe to show; no internals. */
export function coordinatorErrorMessage(code: string | null | undefined): string {
  switch (code) {
    case "COORDINATOR_ALREADY_ASSIGNED":
      return "This course already has a coordinator. Remove them first, then choose someone else.";
    case "COORDINATOR_NOT_ELIGIBLE":
      return "Only an active teacher of this course can be its coordinator. Assign them to one of its classes first.";
    case "COORDINATOR_NOT_FOUND":
      return "This course has no coordinator to remove. Refresh the page.";
    case "COORDINATOR_STALE_VERSION":
      return "Someone else just changed the coordinator. Refresh the page and try again.";
    case "OFFERING_NOT_FOUND":
      return "This course could not be found. Refresh the page.";
    default:
      return "The coordinator was not changed. Refresh the page and try again.";
  }
}

/** Shown to a teacher on courses they coordinate. */
export const COORDINATOR_BADGE_LABEL = "You coordinate this course";
export const COORDINATOR_BADGE_HINT =
  "You can change the lessons, assignments and quizzes shared by every class. Other teachers' class-only content stays theirs.";
