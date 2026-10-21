import { z } from "zod";

export const studentSectionMemberIdSchema = z.string().uuid();
export const studentSectionMoveSchema = z.object({
  sectionId: z.string().uuid(),
  expectedSectionEnrollmentId: z.string().uuid(),
  confirm: z.literal(true),
}).strict();

export function requiresStudentSectionMove(currentSectionId: string, nextSectionId: string) {
  return currentSectionId !== nextSectionId;
}

export function studentSectionMoveMessage(name: string, target: string) {
  return `Move ${name} to ${target}? The previous class placement will be marked MOVED. This cannot be undone automatically.`;
}

/** Exact legacy success copy; the action UI must show it only after a 2xx
 * response and refresh the previous and destination class memberships.
 */
export function studentSectionMoveSuccessMessage():string{
 return "Learner moved successfully";
}
