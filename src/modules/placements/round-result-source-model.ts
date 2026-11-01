/**
 * DB-072 compatibility read boundary.
 *
 * Legacy registered rows can carry HR; a future EXPAND migration also accepts
 * RECRUITER. Both denote recruiter provenance while old and new application
 * versions coexist. This helper does not authorize staging, does not change
 * the producer write vocabulary, and must not be used for role grants.
 */
export function isRecruiterRoundResultSource(source: string): boolean {
  return source === "HR" || source === "RECRUITER";
}

/** A matching provenance label is not permission to replace a colleague's
 * staged result. Compare the persisted submitting identity before both the
 * idempotent-return and supersede paths; role/grant checks remain separate. */
export function isSameRoundResultSubmitter(
  persistedSubmitterUserId: string | null | undefined,
  requesterUserId: string,
): boolean {
  return typeof persistedSubmitterUserId === "string" &&
    persistedSubmitterUserId.length > 0 && requesterUserId.length > 0 &&
    persistedSubmitterUserId === requesterUserId;
}
