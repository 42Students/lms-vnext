import { outboundFetch } from "@/lib/outbound";
import { writeStructuredLog } from "@/observability/logger";
import type { EmailProvider } from "./types";
import { isValidRecipient, normalizeRecipient } from "@/modules/messaging/model";

/**
 * Server-side ZeptoMail adapter. Authentication, notification events and TPO
 * templates share the same fail-closed transport; callers choose a provisioned
 * purpose, never a free-form provider template ID.
 *
 * Legacy event names and keys follow NotificationEvent/NotificationEventRegistry.
 * Events outside LEGACY_EMAIL_EVENTS stay in-app/SMS only until explicitly
 * enabled by product policy; merely provisioning an ID cannot enable email.
 */
export const LEGACY_NOTIFICATION_TEMPLATE_KEYS = {
  JOB_APPLICATION_CONFIRMATION: "application-submitted",
  JOB_SHORTLISTED: "shortlisted",
  JOB_ASSESSMENT_INVITE: "assessment-invite",
  JOB_INTERVIEW_SCHEDULED: "interview-round-update",
  JOB_OFFER_EXTENDED: "offer-issued",
  JOB_HIRED: "hired",
  JOB_APPLICATION_REJECTED: "rejected",
  JOB_WAITLISTED: "waitlisted",
  INTERVIEW_REMINDER: "interview.reminder",
  INTERVIEW_CONFIRMED: "interview.confirmed",
  INTERVIEW_CANCELLED: "interview.cancelled",
  INTERVIEW_RESCHEDULED: "interview.rescheduled",
  COURSE_ASSIGNMENT_DUE: "course.assignment.due",
  COURSE_ASSIGNMENT_SUBMITTED: "course.assignment.submitted",
  COURSE_GRADE_PUBLISHED: "course.grade.published",
  SYSTEM_EMAIL_VERIFICATION: "system.email.verification",
  SYSTEM_APPLICATION_APPROVED: "system.application.approved",
  SYSTEM_APPLICATION_REJECTED: "system.application.rejected",
  // Legacy registry contains 19 events. OTP is indexed for parity, but its
  // delivery remains exclusively on the separate verified OTP purpose.
  SYSTEM_OTP_SMS: "system.otp.sms",
} as const;

export type LegacyMailEvent = keyof typeof LEGACY_NOTIFICATION_TEMPLATE_KEYS;

/** Intentionally small: email costs money; routine student events remain in-app. */
const LEGACY_EMAIL_EVENTS: ReadonlySet<LegacyMailEvent> = new Set([
  "JOB_INTERVIEW_SCHEDULED",
  "INTERVIEW_REMINDER",
  "INTERVIEW_CONFIRMED",
  "SYSTEM_EMAIL_VERIFICATION",
  "SYSTEM_APPLICATION_APPROVED",
  "SYSTEM_APPLICATION_REJECTED",
]);

const REQUIRED_VARIABLES: Partial<Record<LegacyMailEvent, readonly string[]>> = {
  JOB_INTERVIEW_SCHEDULED: [
    "learnerName", "jobTitle", "companyName", "applicationId",
    "roundDescription", "interviewDate", "interviewTime", "interviewMode",
  ],
  INTERVIEW_REMINDER: [
    "learnerName", "jobTitle", "companyName", "applicationId",
    "interviewDate", "interviewTime", "interviewMode", "interviewLocation",
  ],
  INTERVIEW_CONFIRMED: [
    "learnerName", "jobTitle", "companyName", "applicationId",
    "interviewDate", "interviewTime", "interviewMode", "interviewLocation",
  ],
  JOB_APPLICATION_CONFIRMATION: ["learnerName", "jobTitle", "companyName", "applicationId"],
  JOB_SHORTLISTED: ["learnerName", "jobTitle", "companyName", "applicationId"],
  JOB_APPLICATION_REJECTED: ["learnerName", "jobTitle", "companyName", "applicationId"],
  JOB_OFFER_EXTENDED: ["learnerName", "jobTitle", "companyName", "applicationId"],
  JOB_HIRED: ["learnerName", "jobTitle", "companyName", "applicationId"],
  SYSTEM_EMAIL_VERIFICATION: ["otp"],
  SYSTEM_APPLICATION_APPROVED: ["learnerName", "applicationId"],
  SYSTEM_APPLICATION_REJECTED: ["learnerName", "applicationId", "rejectionReason"],
};

export type ZeptoMailConfig = {
  apiUrl: string;
  token: string;
  otpTemplateKey: string;
  fromAddress: string;
  fromName: string;
};

/** Only strip a balanced quote pair; unpaired quotes are invalid credentials. */
function pairedUnquote(value:string){
 return value.length>=2&&value.startsWith('"')&&value.endsWith('"')
  ? value.slice(1,-1):value;
}

export function readZeptoMailConfig(
  env: Record<string, string | undefined> = process.env,
): ZeptoMailConfig {
  return {
    apiUrl: env["ZEPTOMAIL_API_URL"] ?? "https://api.zeptomail.in/v1.1/email/template",
    // Never restore the embedded credential from the old LMS, including in dev.
    token: pairedUnquote((env["ZEPTOMAIL_TOKEN"] ?? "").trim()),
    otpTemplateKey: (env["ZEPTOMAIL_OTP_TEMPLATE_KEY"] ??
      "2518b.4c361928d9526a75.k1.aea6cef0-4e4a-11f1-97e6-e256a66a52e4.19e1e1f015f").trim(),
    fromAddress: env["ZEPTOMAIL_FROM_ADDRESS"] ?? "hello@42lms.com",
    fromName: env["ZEPTOMAIL_FROM_NAME"] ?? "42Learn",
  };
}

/** Reject plaintext, embedded URL credentials and malformed provider endpoints. */
export function isSecureMailProviderEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** HTML-safe text for the OTP merge field, never for the email header. */
export function safeOtpEmailDisplayName(value: string): string {
  const compact = value.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu, " ")
    .replace(/\s+/gu, " ").trim();
  return Array.from(compact).slice(0, 160).join("")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Legacy TPO from-name suffix, bounded for RFC header safety. No caller-
 * supplied campus name is permitted to inject a header or change the domain.
 * The generic fallback is used when the tenant brand is unavailable.
 */
export function campusRecruitmentSenderName(collegeName?:string|null):string {
 const cleaned=safeHeaderName(collegeName??"");
 const suffix=" Campus Recruitment";
 // Reserve suffix width before truncating the college prefix.
 const prefix=Array.from(cleaned).slice(0,Math.max(0,80-Array.from(suffix).length)).join("");
 return prefix?prefix+suffix:"Campus Recruitment";
}

function safeHeaderName(value: string): string {
  return Array.from(value.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu, " ")
    .replace(/\s+/gu, " ").trim()).slice(0, 80).join("");
}

function isTemplateId(value: string): boolean {
  // Provider template keys are opaque. Legacy accepted any trimmed nonempty
  // value. Block placeholders and control characters rather than incorrectly
  // applying the campaign identifier regex to a provider-managed ID.
  return value.length > 0 && value.length <= 200 &&
    !/[\x00-\x1f\x7f]/.test(value) &&
    value.toUpperCase() !== "TEMP_ID_PLACEHOLDER";
}

export type ZeptoMailPurpose =
  | { kind: "OTP" }
  | { kind: "EVENT"; event: LegacyMailEvent }
  | { kind: "TPO"; templateName: string }
  | { kind: "PROJECTS"; templateName: "FINAL_SUBMISSION" | "MEETING_REQUEST" };

export type ZeptoMailTemplateMessage = {
  purpose: ZeptoMailPurpose;
  toEmail: string;
  recipientName?: string;
  mergeInfo?: Record<string, string | null | undefined> | null;
  /** Optional college branding; does not change the verified sending address. */
  senderName?: string;
  /** Scoped, resolved college branding for TPO-only messages. */
  collegeName?: string | null;
  /** Caller-owned stable outbox deduplication token. Retry requires explicit
   * provider idempotency support; never reuse it for a fresh send. */
  idempotencyKey?: string;
  /** Must be provisioned in ZEPTOMAIL_VERIFIED_FROM_ADDRESSES. */
  fromAddress?: string;
  /** Only a verified sending-domain address or explicit allowed reply address. */
  replyTo?: string;
};

export function zeptoMailFailureCopy(code:ZeptoMailFailureCode):string {
 switch(code){
  case "RECIPIENT_REQUIRED":return "Recipient email is required";
  case "RECIPIENT_INVALID":return "Enter a valid recipient email address";
  case "TEMPLATE_NOT_CONFIGURED":return "ZeptoMail template ID is required";
  case "REQUIRED_VARIABLE_MISSING":return "Required email template information is missing";
  case "TOKEN_NOT_CONFIGURED":case "CREDENTIAL_ROTATION_UNVERIFIED":
  case "ENDPOINT_INVALID":case "SENDER_UNVERIFIED":case "REPLY_TO_UNVERIFIED":
   return "Email is not configured for this sender. Contact your administrator.";
  case "PROVIDER_UNAVAILABLE":return "Email provider is unavailable. Check delivery status before retrying.";
  case "PROVIDER_REJECTED":return "Email provider rejected the message.";
  case "DEV_RECIPIENT_NOT_ALLOWED":return "This recipient is not allowed in this environment.";
  case "EVENT_EMAIL_DISABLED":return "Email is not enabled for this notification.";
  case "MERGE_INFO_INVALID":return "Email template values are invalid.";
 }
}

export type ZeptoMailFailureCode =
  | "TOKEN_NOT_CONFIGURED"
  | "CREDENTIAL_ROTATION_UNVERIFIED"
  | "ENDPOINT_INVALID"
  | "TEMPLATE_NOT_CONFIGURED"
  | "EVENT_EMAIL_DISABLED"
  | "RECIPIENT_REQUIRED"
  | "RECIPIENT_INVALID"
  | "DEV_RECIPIENT_NOT_ALLOWED"
  | "SENDER_UNVERIFIED"
  | "REPLY_TO_UNVERIFIED"
  | "MERGE_INFO_INVALID"
  | "REQUIRED_VARIABLE_MISSING"
  | "PROVIDER_REJECTED"
  | "PROVIDER_UNAVAILABLE";

export type ZeptoMailSendResult =
  | { accepted: true }
  | { accepted: false; code: ZeptoMailFailureCode; httpStatus?: number; providerCode?: string };

function purposeLabel(purpose: ZeptoMailPurpose): string {
  return purpose.kind === "EVENT" ? purpose.event :
    purpose.kind === "TPO" ? "TPO" : purpose.kind === "PROJECTS" ? "PROJECTS" : "OTP";
}

/** Explicitly provisioned IDs only. No guessed placeholder or fallback template. */
export function resolveZeptoMailTemplateId(
  purpose: ZeptoMailPurpose,
  env: Record<string, string | undefined> = process.env,
  config: ZeptoMailConfig = readZeptoMailConfig(env),
): string | null {
  let value: string | undefined;
  if (purpose.kind === "OTP") {
    value = config.otpTemplateKey;
  } else if (purpose.kind === "EVENT") {
    if (!Object.prototype.hasOwnProperty.call(LEGACY_NOTIFICATION_TEMPLATE_KEYS, purpose.event)) return null;
    const legacyKey = LEGACY_NOTIFICATION_TEMPLATE_KEYS[purpose.event];
    value = env["ZEPTOMAIL_TEMPLATE_" + purpose.event] ?? env["zepto.template." + legacyKey];
  } else if (purpose.kind === "PROJECTS") {
    value = env["ZEPTOMAIL_TEMPLATE_PROJECTS_" + purpose.templateName];
  } else {
    const name = purpose.templateName.trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(name)) return null;
    value = env["ZEPTOMAIL_TEMPLATE_TPO_" + name.replace(/[.-]/g, "_").toUpperCase()] ??
      env["zepto.template.tpo." + name];
  }
  const key = (value ?? "").trim();
  if (!isTemplateId(key) || (purpose.kind !== "OTP" && key === config.otpTemplateKey)) return null;
  return key;
}

/** Stable, nonsecret readiness/provisioning table for operator dashboards.
 * Keep optional event templates out of required send readiness and avoid
 * recording opaque IDs or provider credentials in the response/logs. */
export function zeptoMailProvisioning(
 env:Record<string,string|undefined>=process.env,
){
 const config=readZeptoMailConfig(env);
 const eventTemplates=Object.keys(LEGACY_NOTIFICATION_TEMPLATE_KEYS).map(event=>{
  const typed=event as LegacyMailEvent;
  return {event:typed,enabled:LEGACY_EMAIL_EVENTS.has(typed),
   configured:Boolean(resolveZeptoMailTemplateId({kind:"EVENT",event:typed},env,config))};
 });
 const senderValid=isValidRecipient("EMAIL",normalizeRecipient("EMAIL",config.fromAddress));
 const tokenConfigured=Boolean(config.token.trim());
 const endpointValid=isSecureMailProviderEndpoint(config.apiUrl);
 const otpTemplateConfigured=Boolean(resolveZeptoMailTemplateId({kind:"OTP"},env,config));
 const missingRequiredEvents=eventTemplates.filter(item=>item.enabled&&!item.configured).map(item=>item.event);
 return {configured:tokenConfigured&&endpointValid&&senderValid&&otpTemplateConfigured&&
   missingRequiredEvents.length===0,tokenConfigured,endpointValid,senderValid,
   otpTemplateConfigured,missingRequiredEvents,eventTemplates};
}

function verifiedFrom(
  rawAddress: string, config: ZeptoMailConfig,
  env: Record<string, string | undefined>,
): boolean {
  const address = normalizeRecipient("EMAIL", rawAddress);
  if (!isValidRecipient("EMAIL", address)) return false;
  const verified = [config.fromAddress, ...(env["ZEPTOMAIL_VERIFIED_FROM_ADDRESSES"] ?? "").split(",")];
  return verified.some((entry) => normalizeRecipient("EMAIL", entry) === address);
}

function verifiedReplyTo(
  rawAddress: string, config: ZeptoMailConfig,
  env: Record<string, string | undefined>,
): boolean {
  const address = normalizeRecipient("EMAIL", rawAddress);
  if (!isValidRecipient("EMAIL", address)) return false;
  const explicit = (env["ZEPTOMAIL_VERIFIED_REPLY_TO_ADDRESSES"] ?? "").split(",");
  if (explicit.some((entry) => normalizeRecipient("EMAIL", entry) === address)) return true;
  // Reply routing on a verified sending domain (including college-specific +tags).
  const domain = address.split("@")[1];
  const domains = [config.fromAddress, ...(env["ZEPTOMAIL_VERIFIED_FROM_ADDRESSES"] ?? "").split(",")]
    .map((entry) => normalizeRecipient("EMAIL", entry))
    .filter((entry) => isValidRecipient("EMAIL", entry))
    .map((entry) => entry.split("@")[1]);
  return domains.includes(domain);
}

function allowedInEnvironment(
  recipient: string, env: Record<string, string | undefined>,
): boolean {
  if (env["APP_ENV"] === "production" || env["STAGE"] === "prod" || env["STAGE"] === "production") return true;
  const configured = [env["DEV_MAIL_ALLOW"] ?? "", env["AUTH_TEST_EMAILS"] ?? ""]
    .join(",").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return configured.some((entry) =>
    entry === recipient || (entry.startsWith("@") && recipient.endsWith(entry)));
}

function validMergeInfo(
  raw: ZeptoMailTemplateMessage["mergeInfo"],
): Record<string, string> | null {
  const entries = Object.entries(raw ?? {});
  if (entries.length > 64) return null;
  const result: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [key, value] of entries) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key) ||
      (value !== null && value !== undefined && (typeof value !== "string" || value.length > 10000))) {
      return null;
    }
    if (value !== null && value !== undefined) result[key] = value;
  }
  return result;
}

/** Non-PII failure reason for API boundaries, admin monitoring and outbox records. */
function notSent(
  purpose: ZeptoMailPurpose,
  code: ZeptoMailFailureCode,
  details: { httpStatus?: number; providerCode?: string } = {},
): ZeptoMailSendResult {
  writeStructuredLog("WARNING", "email.template_not_sent", {
    purpose: purposeLabel(purpose), reason: code, ...details,
  });
  return { accepted: false, code, ...details };
}

async function safeProviderCode(response: Response): Promise<string | undefined> {
  try {
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return undefined;
    const record = data as Record<string, unknown>;
    const nested = record["error"];
    const code = typeof record["code"] === "string" ? record["code"] :
      nested && typeof nested === "object" ?
        (nested as Record<string, unknown>)["code"] : undefined;
    // Never log a provider message or arbitrary error body (may contain PII).
    return typeof code === "string" && /^[a-zA-Z0-9_.-]{1,64}$/.test(code)
      ? code : undefined;
  } catch {
    return undefined;
  }
}

/**
 * OTP and unspecified POSTs are attempted once. A non-OTP outbox with a
 * stable deduplication key may opt into three retries only when the provider's
 * idempotency handling has been independently verified by operations.
 * Timeout without that guarantee is ambiguous, not proof of non-delivery.
 */
export async function sendZeptoMailTemplate(
  message: ZeptoMailTemplateMessage,
  config: ZeptoMailConfig = readZeptoMailConfig(),
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<ZeptoMailSendResult> {
  const purpose = message.purpose;
  if (!config.token.trim()) return notSent(purpose, "TOKEN_NOT_CONFIGURED");
  // Legacy source contained an exposed provider token. Require an explicit
  // operational attestation that the old key was REVOKED and a new one provisioned.
  // No token values, hashes or leaked defaults may be stored in source or logs.
  if ((env["APP_ENV"] === "production" || env["STAGE"] === "prod" || env["STAGE"] === "production") &&
      env["ZEPTOMAIL_LEGACY_KEY_REVOKED"] !== "confirmed") {
    return notSent(purpose, "CREDENTIAL_ROTATION_UNVERIFIED");
  }
  if (!isSecureMailProviderEndpoint(config.apiUrl)) return notSent(purpose, "ENDPOINT_INVALID");
  if (purpose.kind === "EVENT" && !LEGACY_EMAIL_EVENTS.has(purpose.event)) {
    return notSent(purpose, "EVENT_EMAIL_DISABLED");
  }
  const templateKey = resolveZeptoMailTemplateId(purpose, env, config);
  if (!templateKey) return notSent(purpose, "TEMPLATE_NOT_CONFIGURED");

  if (!message.toEmail.trim()) return notSent(purpose, "RECIPIENT_REQUIRED");
  const recipient = normalizeRecipient("EMAIL", message.toEmail);
  if (!isValidRecipient("EMAIL", recipient)) return notSent(purpose, "RECIPIENT_INVALID");
  if (!allowedInEnvironment(recipient, env)) return notSent(purpose, "DEV_RECIPIENT_NOT_ALLOWED");

  const fromAddress = normalizeRecipient("EMAIL", message.fromAddress ?? config.fromAddress);
  if (!verifiedFrom(fromAddress, config, env)) return notSent(purpose, "SENDER_UNVERIFIED");
  const replyTo = message.replyTo ? normalizeRecipient("EMAIL", message.replyTo) : undefined;
  if (replyTo && !verifiedReplyTo(replyTo, config, env)) {
    return notSent(purpose, "REPLY_TO_UNVERIFIED");
  }
  const mergeInfo = validMergeInfo(message.mergeInfo);
  if (!mergeInfo) return notSent(purpose, "MERGE_INFO_INVALID");
  if (purpose.kind === "EVENT") {
    const required = REQUIRED_VARIABLES[purpose.event] ?? [];
    if (required.some((key) => !mergeInfo[key]?.trim())) {
      return notSent(purpose, "REQUIRED_VARIABLE_MISSING");
    }
    if ((purpose.event === "JOB_INTERVIEW_SCHEDULED" ||
      purpose.event === "INTERVIEW_REMINDER" ||
      purpose.event === "INTERVIEW_CONFIRMED") &&
      !mergeInfo["meetingLink"]?.trim() && !mergeInfo["venueAddress"]?.trim() &&
      !mergeInfo["interviewLocation"]?.trim()) {
      return notSent(purpose, "REQUIRED_VARIABLE_MISSING");
    }
  }
  // Retry a non-OTP POST only if the provider is explicitly attested to
  // honor Idempotency-Key AND the caller supplies its durable outbox key.
  const canRetry=purpose.kind!=="OTP"&&
   env["ZEPTOMAIL_IDEMPOTENCY_SUPPORTED"]==="confirmed"&&
   typeof message.idempotencyKey==="string"&&
   /^[a-zA-Z0-9._:-]{16,128}$/.test(message.idempotencyKey);
  try {
    const response = await outboundFetch(config.apiUrl, {
      method: "POST",
      redirect: "error",
      headers: {
        Authorization: config.token,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        template_key: templateKey,
        from: {
          address: fromAddress,
          name: safeHeaderName(message.senderName ?? (purpose.kind==="TPO"?campusRecruitmentSenderName(message.collegeName):config.fromName)),
        },
        to: [{
          email_address: {
            address: recipient,
            name: safeHeaderName(message.recipientName ?? recipient),
          },
        }],
        ...(replyTo ? { reply_to: [{ address: replyTo }] } : {}),
        merge_info: mergeInfo,
      }),
      timeoutMs: 10_000,
      maxAttempts: canRetry?3:1,
      baseDelayMs: 500,
      ...(canRetry?{idempotencyKey:message.idempotencyKey}:{}),
      fetchImpl,
    });
    if (!response.ok) {
      const providerCode = await safeProviderCode(response);
      return notSent(purpose, "PROVIDER_REJECTED", {
        httpStatus: response.status,
        ...(providerCode ? { providerCode } : {}),
      });
    }
    writeStructuredLog("INFO", "email.template_accepted", { purpose: purposeLabel(purpose) });
    return { accepted: true };
  } catch {
    // Provider timeouts are delivery-ambiguous, not evidence of no delivery.
    return notSent(purpose, "PROVIDER_UNAVAILABLE");
  }
}

export function createZeptoMailEmailProvider(
  config: ZeptoMailConfig = readZeptoMailConfig(),
  fetchImpl: typeof fetch = fetch,
): EmailProvider {
  return {
    async sendOtpEmail(message) {
      const recipient = normalizeRecipient("EMAIL", message.toEmail);
      if (!/^[0-9]{4,8}$/.test(message.code)) {
        writeStructuredLog("WARNING", "email.otp_not_sent", { reason: "invalid_otp_format" });
        return false;
      }
      const result = await sendZeptoMailTemplate({
        purpose: { kind: "OTP" },
        toEmail: recipient,
        recipientName: recipient,
        mergeInfo: {
          otp: message.code,
          learnerName: safeOtpEmailDisplayName(message.displayName),
          email: recipient,
          mobile: message.phoneE164 && /^\+[1-9][0-9]{7,14}$/.test(message.phoneE164)
            ? message.phoneE164 : "",
          expiryMinutes: "5",
        },
      }, config, fetchImpl);
      return result.accepted;
    },
  };
}

