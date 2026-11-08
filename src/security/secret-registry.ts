import { checkSecrets, type ConfigIssue, type SecretSpec } from "@/security/config-core";

const machine = (name: string, purpose: string, requiredInProduction = true): SecretSpec =>
  ({ name, purpose, kind: "secret", minBytes: 32, requiredInProduction, distinct: true });
const key = (name: string, purpose: string): SecretSpec =>
  ({ name, purpose, kind: "base64-key", bytes: 32, requiredInProduction: true, distinct: true });

/** Every machine credential and key the platform reads. Adding a secret to the code means adding it here. */
export const SECRET_REGISTRY: readonly SecretSpec[] = [
  machine("INTERNAL_ALERT_TICK_SECRET", "alerts tick scheduler"),
  machine("NOTIFICATION_RELEASE_TOKEN", "notification release worker"),
  machine("TPO_NOTICE_SCHEDULER_SECRET", "TPO notice delivery scheduler"),
  machine("TPO_REMINDER_SCHEDULER_SECRET", "TPO reminder scheduler"),
  machine("DB10_NOTIFICATION_SCHEDULER_SECRET", "notification dispatch scheduler"),
  machine("RECRUITER_MESSAGE_WORKER_SECRET", "recruiter message worker"),
  machine("MENTOR_PROJECT_EMAIL_WORKER_TOKEN", "mentor project email worker"),
  machine("AUDIT_FINDINGS_CRON_SECRET", "audit findings sync cron"),
  machine("PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET", "private storage scanner callback"),
  machine("TELEGRAM_ALERT_WEBHOOK_SECRET", "Telegram alert webhook"),
  machine("AUTH_SECRET", "session signing"),
  machine("AUTH_ROLE_PROOF_SECRET", "role proof signing"),
  machine("AUTH_EMAIL_VERIFICATION_SECRET", "email verification signing"),
  machine("TPO_RECRUITER_OTP_HMAC_SECRET", "recruiter OTP HMAC"),
  machine("LOG_ALERT_ACCOUNT_HASH_KEY", "log alert account hashing"),
  // Optional in production (a deployment without inbound mail does not need them) but validated when present (SEC-15).
  machine("INBOUND_MAIL_HMAC_SECRET", "inbound mail worker signature", false),
  machine("RECRUITER_MESSAGE_INBOUND_HMAC_SECRET", "recruiter message inbound signature", false),
  machine("RECRUITER_MESSAGE_REPLY_TOKEN_SECRET", "recruiter message reply token", false),
  // Own key for company share access proofs so one leak cannot also forge sessions (SEC-15). Falls back to AUTH_SECRET when unset.
  machine("COMPANY_SHARE_PROOF_SECRET", "company share access proof", false),
  key("DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64", "outbound global email HMAC"),
  key("DB10_NOTIFICATION_DEDUPE_KEY_BASE64", "notification dedupe HMAC"),
  key("DB10_OUTBOUND_ENCRYPTION_KEY_BASE64", "outbound payload encryption"),
];

/** Validates the live environment. Never throws and never returns a secret value. */
export function validateSecretConfig(env: Record<string, string | undefined> = process.env): ConfigIssue[] {
  return checkSecrets(env, SECRET_REGISTRY, env["NODE_ENV"] === "production");
}
