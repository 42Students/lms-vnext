/**
 * Shared, client-safe message catalog. Usage:
 *   friendlyApiError({ status: response.status, code: body.error, network: false })
 *   // Display only this text, never the provider or API code.
 * Domain-code overrides mirror the server-only module error mappers; do not
 * import those mappers here (they depend on NextResponse and server services).
 */
export type FriendlyErrorInput = {
  status?: number | null;
  // Explicit undefined is supported under exactOptionalPropertyTypes.
  code?: string | null | undefined;
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
  QUIZ_DEADLINE_NOT_CONFIGURED: "Due date is required before publishing",
  QUIZ_DEADLINE_PASSED: "Cannot publish a quiz after its due date",
  QUIZ_QUESTION_INVALID: "Add at least one valid question before publishing",
  QUIZ_UNPUBLISH_LOCKED: "A quiz cannot be unpublished after submissions exist or after its deadline has passed",
  QUIZ_QUESTIONS_LOCKED: "Quiz questions cannot be changed after learner submissions exist or after a published quiz has closed",
  QUIZ_ATTEMPT_LIMIT_LOCKED: "Attempt limit cannot be changed after learner submissions exist or after a published quiz has closed",
  QUIZ_DEADLINE_LOCKED: "Quiz deadline cannot be changed after learner submissions exist or after a published quiz has closed",
  QUIZ_RANDOMIZATION_LOCKED: "Quiz randomization settings cannot be changed after learner submissions exist or after a published quiz has closed",

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
    return domainMessages[code] ?? FRIENDLY_MESSAGES.unexpected;
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

/** Legacy apiError.js presentation crosswalk. Intentionally separate from
 * domain-specific friendlyApiError: page actions may display the exact old
 * heading while the endpoint continues to redact private provider text.
 */
export type FriendlyErrorKind="canceled"|"timeout"|"offline"|"network"|"auth"|
  "permission"|"not_found"|"conflict"|"validation"|"rate_limit"|"server"|"unknown";
export function friendlyApiErrorPresentation(input:FriendlyErrorInput&{cancelled?:boolean}){
 const {status,code,network,cancelled}=input;
 const offline=network&&typeof navigator!=="undefined"&&navigator.onLine===false;
 const kind:FriendlyErrorKind=cancelled||code==="REQUEST_CANCELLED"?"canceled":
  status===504?"timeout":offline?"offline":network?"network":
  status===401||Boolean(code&&sessionCodes.has(code))?"auth":
  status===403?"permission":status===404?"not_found":
  status===409||Boolean(code&&conflictCodes.has(code))?"conflict":
  status===422||status===400?"validation":status===429?"rate_limit":
  status!==undefined&&status!==null&&status>=500?"server":"unknown";
 const copy:Record<FriendlyErrorKind,{title:string;message:string;retryable:boolean}>={
  canceled:{title:"Request cancelled",message:"The request was cancelled.",retryable:false},
  timeout:{title:"Request timed out",message:"The LMS took too long to respond. Try again.",retryable:true},
  offline:{title:"You're offline",message:"Reconnect to the internet, then try again. Your current screen has not been cleared.",retryable:true},
  network:{title:"Connection problem",message:"We couldn't reach the LMS. Check your connection and try again.",retryable:true},
  auth:{title:"Session expired",message:"Please sign in again to continue.",retryable:false},
  permission:{title:"Access not allowed",message:"You don't have permission to perform this action.",retryable:false},
  not_found:{title:"No longer available",message:"This item could not be found. It may have been removed or moved.",retryable:false},
  conflict:{title:"This changed elsewhere",message:"Refresh the latest data before trying again.",retryable:true},
  validation:{title:"Some information needs attention",message:"Review the highlighted or entered information and try again.",retryable:false},
  rate_limit:{title:"Too many requests",message:"Please wait a moment before trying again.",retryable:true},
  server:{title:"LMS service problem",message:"The server couldn't complete the request. Try again shortly.",retryable:true},
  unknown:{title:"Something went wrong",message:"We couldn't complete that request.",retryable:true},
 };
 return {kind,...copy[kind]};
}
