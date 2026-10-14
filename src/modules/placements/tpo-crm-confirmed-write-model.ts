/**
 * User-authored NOTE activities carry the authenticated actor. DB09 reserves
 * SYSTEM activities for non-user events, so human stage changes must not
 * impersonate a SYSTEM event.
 */
export function leadCreatedAuditNote(): string {
  return "Recruiter lead created";
}

export function leadNotNowAuditNote(previousStage: string): string {
  return previousStage === "NOT_NOW"
    ? "Not Now reason or revisit date updated"
    : "Manual stage changed to Not Now";
}

export function isSameNotNowDecision(
  current: { manualStage: string; notNowReason: string | null; notNowUntil: string | null },
  next: { reason?: string | null; revisitDate?: string | null },
): boolean {
  return current.manualStage === "NOT_NOW" &&
    current.notNowReason === (next.reason ?? null) &&
    current.notNowUntil === (next.revisitDate ?? null);
}
