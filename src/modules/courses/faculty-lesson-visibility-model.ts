import { z } from "zod";

import { ROLE } from "@/modules/identity/roles";
import { zUuid } from "@/lib/schema-primitives";
/** Only scoped administrators can alter the student-visible state of shared lesson content. */
export const lessonVisibilityCommandSchema = z.object({
  lessonContentId: zUuid,
  visibleToStudents: z.boolean(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  confirmed: z.literal(true),
}).strict();

export function lessonVisibleToReader(input: {
  role: "ADMIN" | "FACULTY" | "LEARNER";
  lessonPublished: boolean;
  contentPublished: boolean;
  visibleToStudents: boolean;
  belongsToAssignedDelivery: boolean;
}): boolean {
  if (input.role === "ADMIN") return true;
  if (!input.belongsToAssignedDelivery) return false;
  if (input.role === ROLE.FACULTY) return true;
  return input.lessonPublished && input.contentPublished && input.visibleToStudents;
}

export function mayEditLessonStudentVisibility(role: "ADMIN" | "FACULTY" | "LEARNER") {
  return role === "ADMIN";
}
