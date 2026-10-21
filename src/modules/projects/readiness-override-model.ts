import { z } from "zod";
export const readinessOverrideInputSchema = z.discriminatedUnion("state", [
  z.object({state:z.enum(["FORCE_UNLOCK","FORCE_BLOCK"]),note:z.string().trim().min(1).max(2000)}).strict(),
  z.object({state:z.literal("CLEAR")}).strict(),
]);
export type ReadinessOverrideState = "FORCE_UNLOCK" | "FORCE_BLOCK" | "CLEAR";
/** An existing final submission wins over every manual override when deciding
 * whether another final delivery is available. Consumers must pass the
 * authoritative persisted hasFinalSubmission flag, not a visual guess. */
export function effectiveProjectSubmissionReady(
 defaultReady:boolean,state:ReadinessOverrideState|null,hasFinalSubmission=false,
) {
  if(hasFinalSubmission)return false;
  return state === "FORCE_UNLOCK" ? true : state === "FORCE_BLOCK" ? false : defaultReady;
}

/** Repeated delivery of one administrator intent must not create another
 * activity event. The parent project row is locked before this is checked. */
export function isDuplicateProjectReadinessOverride(
  current: { state: ReadinessOverrideState | null; note: string | null },
  next: { state: ReadinessOverrideState; note?: string },
): boolean {
  const priorState = current.state ?? "CLEAR";
  if (priorState !== next.state) return false;
  return next.state === "CLEAR" || current.note === next.note;
}
