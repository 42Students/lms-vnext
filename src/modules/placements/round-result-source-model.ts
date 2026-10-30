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
