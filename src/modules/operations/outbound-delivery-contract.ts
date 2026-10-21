import { z } from "zod";

/**
 * Shared W06 outbound intent. Producers own permission checks; this contract
 * is not an authorization shortcut or a send API.
 * Never log inputs: invitationUrl can contain a single-use bearer credential.
 */
export const OUTBOUND_CHANNELS = ["EMAIL", "SMS", "WHATSAPP"] as const;
export const OUTBOUND_TEMPLATE_KEYS = [
  "RECRUITER_INVITATION",
  "RECRUITER_INVITATION_REMINDER",
] as const;

/**
 * Legacy Exotel mapped these seven placement events to one intended TRAI
 * job-update body. This is a producer-event inventory, NOT a send-template
 * registry: the vNext job-update DLT template ID has not been verified.
 * Keep every event outside OUTBOUND_TEMPLATE_KEYS until provider registration,
 * scoped producer authorization, SMS opt-out and audited delivery are wired.
 */
export const LEGACY_JOB_SMS_EVENTS = [
  "application-submitted",
  "shortlisted",
  "interview-round-update",
  "selected",
  "rejected",
  "interview.reminder",
  "interview.confirmed",
] as const;

/** Read-only purpose names from the legacy delivery ledger. These are not send templates. */
export const LEGACY_SMS_PURPOSE_LABELS = {
 "attendance.absence":"Attendance absence",
 "attendance.correction":"Attendance correction",
 "otp":"One-time password",
 "job.update":"Placement update",
} as const;

export const adminOutboundLogReadSchema=z.object({
 purpose:z.enum(["ALL",...Object.keys(LEGACY_SMS_PURPOSE_LABELS) as
  [keyof typeof LEGACY_SMS_PURPOSE_LABELS,...(keyof typeof LEGACY_SMS_PURPOSE_LABELS)[]]]).default("ALL"),
 page:z.coerce.number().int().min(0).max(10000).default(0),
 size:z.coerce.number().int().min(1).max(100).default(20),
 // Never place a complete recipient, email or phone number into an audit/log URL.
 recipientSuffix:z.string().regex(/^[0-9]{2,4}$/).optional(),
}).strict();
export type AdminOutboundLogReadQuery=z.infer<typeof adminOutboundLogReadSchema>;
export function parseAdminOutboundLogRead(raw:unknown):AdminOutboundLogReadQuery|null{
 const parsed=adminOutboundLogReadSchema.safeParse(raw);
 return parsed.success?parsed.data:null;
}

export const LEGACY_SMS_ORIGINS = [
  "otp",
  "notification",
  "job.update",
  "attendance.parent",
] as const;

/** Never mistake an identified legacy event for authorization to send. */
export function legacyJobSmsReadiness(event: string):
  "DLT_UNVERIFIED" | "UNSUPPORTED_EVENT" {
  return (LEGACY_JOB_SMS_EVENTS as readonly string[]).includes(event)
    ? "DLT_UNVERIFIED" : "UNSUPPORTED_EVENT";
}

const privateInviteUrl = z.string().url().max(2048).refine((raw) => {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" &&
      !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}, "Secure HTTPS invitation link required");

const mergeVariables = z.object({
  companyName: z.string().trim().min(1).max(180),
  collegeName: z.string().trim().min(1).max(180),
  contactName: z.string().trim().min(1).max(180).optional(),
  /** Legacy hr-invite template supports signature, note and expiresDays. */
  signature: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
  expiresDays: z.number().int().min(1).max(90).optional(),
  invitationUrl: privateInviteUrl,
}).strict();

const offsetInstant = z.iso.datetime({ offset: true });

const intentSchema = z.object({
  organizationId: z.string().uuid(),
  collegeId: z.string().uuid(),
  /** One stable producer-issued UUID per logical invitation/reminder event. */
  sourceEventId: z.string().uuid(),
  channel: z.enum(OUTBOUND_CHANNELS),
  templateKey: z.enum(OUTBOUND_TEMPLATE_KEYS),
  recipient: z.string().trim().min(3).max(320),
  variables: mergeVariables,
  notBefore: offsetInstant.optional(),
  expiresAt: offsetInstant.optional(),
}).strict().superRefine((intent, ctx) => {
  if (intent.expiresAt && intent.notBefore &&
      new Date(intent.expiresAt) <= new Date(intent.notBefore)) {
    ctx.addIssue({
      code: "custom",
      path: ["expiresAt"],
      message: "Expiry must follow earliest send",
    });
  }
  const allowed = intent.channel === "EMAIL"
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intent.recipient)
    : /^\+[1-9][0-9]{1,14}$/.test(intent.recipient);
  if (!allowed) ctx.addIssue({
    code: "custom", path: ["recipient"],
    message: "Recipient must match outbound channel",
  });
});

export type OutboundDeliveryIntent = z.infer<typeof intentSchema>;

export class OutboundDeliveryError extends Error {
  constructor(readonly code:
    | "INVALID_OUTBOUND_INTENT"
    | "OUTBOUND_KEY_UNAVAILABLE"
    | "OUTBOUND_ENVELOPE_INVALID"
    | "OUTBOUND_QUEUE_DISABLED"
    | "OUTBOUND_IDEMPOTENCY_CONFLICT"
    | "OUTBOUND_SCOPE_INVALID",
  ) {
    super(code);
    this.name = "OutboundDeliveryError";
  }
}

/** Parse and canonicalize without throwing Zod messages containing PII. */
export function parseOutboundIntent(raw: unknown): OutboundDeliveryIntent {
  const result = intentSchema.safeParse(raw);
  if (!result.success) {
    throw new OutboundDeliveryError("INVALID_OUTBOUND_INTENT");
  }
  return {
    ...result.data,
    recipient: result.data.channel === "EMAIL"
      ? result.data.recipient.toLowerCase()
      : result.data.recipient,
  };
}
