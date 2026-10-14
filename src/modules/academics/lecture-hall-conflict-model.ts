/** Depend solely on rows returned from upcoming SCHEDULED sessions, not a
 * stale UI count. Unknown class capacity cannot imply a false constraint. */
export function lectureHallScheduledConflict(input: {
  archiving: boolean;
  nextCapacity?: number;
  scheduledCapacityRows: readonly (number | null)[];
}): "HALL_IN_USE" | "HALL_CAPACITY_CONFLICT" | null {
  if (input.archiving && input.scheduledCapacityRows.length > 0) return "HALL_IN_USE";
  if (input.nextCapacity !== undefined && input.scheduledCapacityRows.some(
    capacity => capacity !== null && capacity > input.nextCapacity!,
  )) return "HALL_CAPACITY_CONFLICT";
  return null;
}
