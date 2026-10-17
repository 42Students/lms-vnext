export type AlertDecision = "NEW" | "REGRESSION" | "SPIKE" | "NONE";

export function decideAlert(input: {
  known: boolean;
  muted: boolean;
  fixStatus: string;
  fixedAt: Date | null;
  recentCount: number;
  lastSpikeAt: Date | null;
  now: Date;
}): AlertDecision {
  if (!input.known) return "NEW";
  if (input.fixStatus === "FIXED" && input.fixedAt &&
      input.now.getTime() - input.fixedAt.getTime() >= 86_400_000) return "REGRESSION";
  if (input.recentCount >= (input.muted ? 25 : 20) &&
      (!input.lastSpikeAt || input.now.getTime() - input.lastSpikeAt.getTime() >= 3_600_000)) {
    return "SPIKE";
  }
  return "NONE";
}

/** Never charge a repeat delivery attempt for an unsaved new signature. */
export function countSuppressedOccurrence(knownSignature: boolean): boolean {
  return knownSignature;
}

/** Global quota: four individual alerts plus at most one burst summary per minute. */
export function burstSlot(sent: number): "INDIVIDUAL" | "SUMMARY" | "SUPPRESS" {
  return sent < 4 ? "INDIVIDUAL" : sent === 4 ? "SUMMARY" : "SUPPRESS";
}
