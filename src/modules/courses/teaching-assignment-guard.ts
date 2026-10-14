import type { CreateCourseTeachingAssignmentInput } from "./validation";

export type TeachingAssignmentConflictCode =
  | "TEACHING_ASSIGNMENT_CONFLICT"
  | "PRIMARY_TEACHER_CONFLICT";

/**
 * Pure preflight; the database active unique indexes remain the final
 * concurrency barrier. Same member must not hold multiple live roles on
 * the same delivery; only one primary teacher may be live at once.
 */
export function teachingAssignmentConflict(
  requested: Pick<CreateCourseTeachingAssignmentInput, "membershipId" | "role">,
  existing: readonly { membershipId: string; role: string }[],
): TeachingAssignmentConflictCode | null {
  if (existing.some(item => item.membershipId === requested.membershipId)) {
    return "TEACHING_ASSIGNMENT_CONFLICT";
  }
  if (requested.role === "PRIMARY" && existing.some(item => item.role === "PRIMARY")) {
    return "PRIMARY_TEACHER_CONFLICT";
  }
  return null;
}
