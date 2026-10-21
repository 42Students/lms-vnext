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

export function readZeptoMailConfig(
  env: Record<string, string | undefined> = process.env,
): ZeptoMailConfig {
  return {
    apiUrl: env.ZEPTOMAIL_API_URL ?? "https://api.zeptomail.in/v1.1/email/template",
    // Never restore the embedded credential from the old LMS, including in dev.
    token: (env.ZEPTOMAIL_TOKEN ?? "").trim().replace(/^"|"$/g, ""),
    otpTemplateKey: env.ZEPTOMAIL_OTP_TEMPLATE_KEY ??
      "2518b.4c361928d9526a75.k1.aea6cef0-4e4a-11f1-97e6-e256a66a52e4.19e1e1f015f",
    fromAddress: env.ZEPTOMAIL_FROM_ADDRESS ?? "hello@42lms.com",
    fromName: env.ZEPTOMAIL_FROM_NAME ?? "42Learn",
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

function safeHeaderName(value: string): string {
  return Array.from(value.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu, " ")
    .replace(/\s+/gu, " ").trim()).slice(0, 160).join("");
}

function isTemplateId(value: string): boolean {
  return value.length <= 200 && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(value) &&
    value !== "TEMP_ID_PLACEHOLDER";
}

export type ZeptoMailPurpose =
  | { kind: "OTP" }
  | { kind: "EVENT"; event: LegacyMailEvent }
  | { kind: "TPO"; templateName: string };

export type ZeptoMailTemplateMessage = {
  purpose: ZeptoMailPurpose;
  toEmail: string;
  recipientName?: string;
  mergeInfo?: Record<string, string | null | undefined> | null;
  /** Optional college branding; does not change the verified sending address. */
  senderName?: string;
  /** Must be provisioned in ZEPTOMAIL_VERIFIED_FROM_ADDRESSES. */
  fromAddress?: string;
  /** Only a verified sending-domain address or explicit allowed reply address. */
  replyTo?: string;
};

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
    purpose.kind === "TPO" ? "TPO" : "OTP";
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

function verifiedFrom(
  rawAddress: string, config: ZeptoMailConfig,
  env: Record<string, string | undefined>,
): boolean {
  const address = normalizeRecipient("EMAIL", rawAddress);
  if (!isValidRecipient("EMAIL", address)) return false;
  const verified = [config.fromAddress, ...(env.ZEPTOMAIL_VERIFIED_FROM_ADDRESSES ?? "").split(",")];
  return verified.some((entry) => normalizeRecipient("EMAIL", entry) === address);
}

function verifiedReplyTo(
  rawAddress: string, config: ZeptoMailConfig,
  env: Record<string, string | undefined>,
): boolean {
  const address = normalizeRecipient("EMAIL", rawAddress);
  if (!isValidRecipient("EMAIL", address)) return false;
  const explicit = (env.ZEPTOMAIL_VERIFIED_REPLY_TO_ADDRESSES ?? "").split(",");
  if (explicit.some((entry) => normalizeRecipient("EMAIL", entry) === address)) return true;
  // Reply routing on a verified sending domain (including college-specific +tags).
  const domain = address.split("@")[1];
  const domains = [config.fromAddress, ...(env.ZEPTOMAIL_VERIFIED_FROM_ADDRESSES ?? "").split(",")]
    .map((entry) => normalizeRecipient("EMAIL", entry))
    .filter((entry) => isValidRecipient("EMAIL", entry))
    .map((entry) => entry.split("@")[1]);
  return domains.includes(domain);
}

function allowedInEnvironment(
  recipient: string, env: Record<string, string | undefined>,
): boolean {
  if (env.APP_ENV === "production" || env.STAGE === "prod" || env.STAGE === "production") return true;
  const configured = [env.DEV_MAIL_ALLOW ?? "", env.AUTH_TEST_EMAILS ?? ""]
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
    const nested = record.error;
    const code = typeof record.code === "string" ? record.code :
      nested && typeof nested === "object" ?
        (nested as Record<string, unknown>).code : undefined;
    // Never log a provider message or arbitrary error body (may contain PII).
    return typeof code === "string" && /^[a-zA-Z0-9_.-]{1,64}$/.test(code)
      ? code : undefined;
  } catch {
    return undefined;
  }
}

/**
 * One attempt only: ZeptoMail template POST has no confirmed idempotency key.
 * Upstream jobs may retry only after recording a provider-safe outbox state;
 * a timeout is ambiguous, not evidence that the recipient did not get email.
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
  if ((env.APP_ENV === "production" || env.STAGE === "prod" || env.STAGE === "production") &&
      env.ZEPTOMAIL_LEGACY_KEY_REVOKED !== "confirmed") {
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
    if (purpose.event === "JOB_INTERVIEW_SCHEDULED" &&
      !mergeInfo.meetingLink?.trim() && !mergeInfo.venueAddress?.trim()) {
      return notSent(purpose, "REQUIRED_VARIABLE_MISSING");
    }
  }
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
          name: safeHeaderName(message.senderName ?? config.fromName),
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
      maxAttempts: 1,
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
