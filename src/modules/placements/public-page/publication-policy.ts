import { z } from "zod";

/** T-S2-08: opt-in never creates a public cohort population from thin air. */
export const publicPlacementPublicationInput = z.object({
  enabled: z.boolean(),
}).strict();

export function publicPublicationDecision(
  input: {enabled: boolean},
  settings: {populationCount: number | null; publishedAt: Date | null} | null,
): "ENABLE" | "DISABLE" | "NOT_CONFIGURED" | "SMALL_COHORT" {
  if (!input.enabled) return "DISABLE";
  if (!settings) return "NOT_CONFIGURED";
  if (!Number.isSafeInteger(settings.populationCount) ||
      (settings.populationCount ?? 0) < 5) return "SMALL_COHORT";
  return "ENABLE";
}

export function publicPublicationTimestamp(enabled: boolean, now: Date): Date | null {
  if (!Number.isFinite(now.getTime())) throw new Error("INVALID_PUBLICATION_CLOCK");
  return enabled ? new Date(now) : null;
}
