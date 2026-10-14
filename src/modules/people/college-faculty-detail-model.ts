import { z } from "zod";

export const collegeFacultyAssignmentHistoryQuerySchema = z.strictObject({
  status: z.enum(["ALL", "ACTIVE", "ENDED"]).default("ALL"),
});

export function facultyTeachingAssignmentState(
  endedAt: Date | null, deliveryEndedAt: Date | null,
): "ACTIVE" | "ENDED" {
  return endedAt === null && deliveryEndedAt === null ? "ACTIVE" : "ENDED";
}
