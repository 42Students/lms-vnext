/**
 * Shared, client-safe message catalog. Usage:
 *   friendlyApiError({ status: response.status, code: body.error, network: false })
 *   // Display only this text, never the provider or API code.
 * Domain-code overrides mirror the server-only module error mappers; do not
 * import those mappers here (they depend on NextResponse and server services).
 */
export type FriendlyErrorInput = {
  status?: number | null;
  code?: string | null;
  network?: boolean;
};

export const FRIENDLY_MESSAGES = {
  unexpected: "Something went wrong on our side. Please try again in a moment.",
  session: "Please sign in again to continue.",
  forbidden: "You do not have permission to do this. Please contact your administrator if needed.",
  missing: "We could not find that. Please refresh and try again.",
  conflict: "This changed elsewhere. Refresh the latest data before trying again.",
  invalid: "Please check the highlighted fields and try again.",
  tooLarge: "This file is too large. Please choose a smaller file.",
  fileType: "This file type is not supported. Please choose another file.",
  unprocessable: "Please check the information and try again.",
  rateLimit: "Too many attempts. Please wait a minute and try again.",
  maintenance: "We are making a quick update. Please try again in a minute.",
  databaseUnavailable: "Temporarily unavailable, please try again in a minute.",
  timeout: "The LMS took too long to respond. Try again.",
  offline: "You appear to be offline. Check your connection and try again.",
} as const;

/** Keep only intentional, customer-readable domain overrides. */
const domainMessages: Readonly<Record<string, string>> = {
  ADMIN_SCOPE_NOT_FOUND: "Invalid college or organization selection. Choose an active scope and try again.",
  TPO_CRM_CONTACT_REQUIRED: "Please add a contact before continuing.",
  TPO_CRM_LEAD_NOT_FOUND: "We could not find that lead. Refresh and try again.",
  TPO_CRM_FOLLOWUP_NOT_FOUND: "We could not find that follow-up. Refresh and try again.",
  TPO_COMPANY_NOT_FOUND: "We could not find that company. Refresh and try again.",
  TPO_MESSAGE_THREAD_NOT_FOUND: "This conversation is no longer available. Refresh and try again.",
  TPO_MESSAGE_RECRUITER_NOT_FOUND: "We could not find that recruiter. Refresh and try again.",
  TPO_MESSAGE_JOB_NOT_FOUND: "We could not find that job. Refresh and try again.",
  TPO_RECRUITER_INVITE_NOT_FOUND: "This invitation is no longer available. Ask for a new invitation.",
  INVITE_INVALID: "This invitation is no longer available. Ask for a new invitation.",
  FACULTY_GRADEBOOK_TOO_MANY_ASSESSMENTS: "This Section has more than 100 published assessments. Contact your college administrator to request a gradebook report.",
  FACULTY_HAS_ACTIVE_PROJECTS: "This faculty member mentors active project workspaces. Reassign those projects to another mentor before suspending or ending the membership.",
  PROJECT_CLASS_ROSTER_STALE: "The class roster changed while teams were being created. Refresh the roster, review the preview, and try again.",
  PROJECT_TEAM_PREVIEW_STALE: "The team preview changed. Review the current teams and try again.",
  LEARNER_PROFILE_SECTION_STALE: "Index out of bounds. Please refresh and try again.",
  STALE_VERSION: FRIENDLY_MESSAGES.conflict,
  STALE_AUDIENCE: FRIENDLY_MESSAGES.conflict,
};

const sessionCodes = new Set(["SESSION_EXPIRED", "SESSION_INVALID", "UNAUTHENTICATED", "AUTH_REQUIRED", "INVALID_SESSION"]);
const conflictCodes = new Set(["STALE_VERSION", "STALE_AUDIENCE", "VERSION_CONFLICT"]);

/** GR-01 / GR-02: error codes are never shown in customer UI. */
export function friendlyApiError({ status, code, network = false }: FriendlyErrorInput): string {
  if (network) return FRIENDLY_MESSAGES.offline;
  if (code === "DATABASE_UNAVAILABLE") return FRIENDLY_MESSAGES.databaseUnavailable;
  if (status === 503) return FRIENDLY_MESSAGES.maintenance;
  if (status === 504) return FRIENDLY_MESSAGES.timeout;
  if (status !== undefined && status !== null && status >= 500) return FRIENDLY_MESSAGES.unexpected;
  if (code === "INTERNAL_ERROR") return FRIENDLY_MESSAGES.unexpected;
  if (status === 401 || (code && sessionCodes.has(code))) return FRIENDLY_MESSAGES.session;
  if (status === 403 || code === "FORBIDDEN") return FRIENDLY_MESSAGES.forbidden;
  if (code && Object.prototype.hasOwnProperty.call(domainMessages, code)) {
    return domainMessages[code];
  }
  if (status === 404) return FRIENDLY_MESSAGES.missing;
  if (status === 409 || (code && conflictCodes.has(code))) return FRIENDLY_MESSAGES.conflict;
  if (status === 413) return FRIENDLY_MESSAGES.tooLarge;
  if (status === 415) return FRIENDLY_MESSAGES.fileType;
  if (status === 429) return FRIENDLY_MESSAGES.rateLimit;
  if (status === 422) return FRIENDLY_MESSAGES.unprocessable;
  if (status === 400 || code === "INVALID_REQUEST") return FRIENDLY_MESSAGES.invalid;
  return FRIENDLY_MESSAGES.unexpected;
}

export function friendlyReference(requestId?: string | null): string | null {
  return requestId && /^[a-f0-9]{8}$/i.test(requestId) ? `Reference: ${requestId}` : null;
}
