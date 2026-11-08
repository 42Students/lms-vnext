/** Older services refuse a wrong role by throwing a plain Error whose text is one of these keys. The text is only
 * compared against this fixed list; it is never returned to a caller. */
const PLAIN_ROLE_DENIALS: ReadonlySet<string> = new Set(["FACULTY_ROLE_REQUIRED", "TPO_ROLE_REQUIRED", "PENDING_RECRUITER_ACCESS_DENIED"]);

export function isPlainRoleDenial(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return PLAIN_ROLE_DENIALS.has(String(error.message).replace(/^Error: /, ""));
}
