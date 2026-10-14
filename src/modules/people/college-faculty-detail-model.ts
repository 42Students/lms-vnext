import { z } from "zod";
import { COURSE_TEACHING_ROLES } from "@/modules/courses/constants";

export const collegeFacultyAssignmentHistoryQuerySchema = z.strictObject({
  status: z.enum(["ALL", "ACTIVE", "ENDED"]).default("ALL"),
  role: z.union([z.literal("ALL"),z.enum(COURSE_TEACHING_ROLES)]).default("ALL"),
});

export function facultyTeachingAssignmentState(
  endedAt: Date | null, deliveryEndedAt: Date | null,
): "ACTIVE" | "ENDED" {
  return endedAt === null && deliveryEndedAt === null ? "ACTIVE" : "ENDED";
}
