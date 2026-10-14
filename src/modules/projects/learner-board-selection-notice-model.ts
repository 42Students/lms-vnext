import { z } from "zod";
const idSchema=z.string().uuid();
/** A stale deep link cannot reveal whether a task belongs to a different project. */
export function learnerBoardTaskSelectionNotice(
  rawTaskId: unknown, foundInAuthorizedProject: boolean,
): string|null {
  if(!idSchema.safeParse(rawTaskId).success || foundInAuthorizedProject) return null;
  return "This task is no longer available in your Project. Your Board has not been changed.";
}
