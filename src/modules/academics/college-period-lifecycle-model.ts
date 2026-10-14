import { z } from "zod";

export const collegePeriodLifecycleSchema = z.strictObject({
  action: z.enum(["CLOSE", "REOPEN"]),
  confirm: z.literal(true),
});
export type CollegePeriodLifecycleAction = z.infer<typeof collegePeriodLifecycleSchema>["action"];

export type PeriodLifecycleGuardCounts = {
  openSections: number;
  scheduledSessions: number;
};
export function periodLifecycleBlocker(
  action: CollegePeriodLifecycleAction,
  counts: PeriodLifecycleGuardCounts,
): "PERIOD_HAS_OPEN_SECTIONS" | "PERIOD_HAS_SCHEDULED_SESSIONS" | null {
  if (action === "REOPEN") return null;
  if (counts.openSections > 0) return "PERIOD_HAS_OPEN_SECTIONS";
  if (counts.scheduledSessions > 0) return "PERIOD_HAS_SCHEDULED_SESSIONS";
  return null;
}
