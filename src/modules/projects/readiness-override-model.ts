import { z } from "zod";
export const readinessOverrideInputSchema = z.discriminatedUnion("state", [
  z.object({state:z.enum(["FORCE_UNLOCK","FORCE_BLOCK"]),note:z.string().trim().min(1).max(2000)}).strict(),
  z.object({state:z.literal("CLEAR")}).strict(),
]);
export type ReadinessOverrideState = "FORCE_UNLOCK" | "FORCE_BLOCK" | "CLEAR";
export function effectiveProjectSubmissionReady(defaultReady:boolean,state:ReadinessOverrideState|null) {
  return state === "FORCE_UNLOCK" ? true : state === "FORCE_BLOCK" ? false : defaultReady;
}
