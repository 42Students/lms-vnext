export function facultyTeachingAssignmentState(
  endedAt: Date | null, deliveryEndedAt: Date | null,
): "ACTIVE" | "ENDED" {
  return endedAt === null && deliveryEndedAt === null ? "ACTIVE" : "ENDED";
}
