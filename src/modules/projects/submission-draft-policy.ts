/** Approved deliveries are terminal: creating a fresh draft must not reopen review. */
export function projectSubmissionAllowsNewDraft(latestStatus: string | null | undefined): boolean {
  return latestStatus !== "APPROVED";
}
