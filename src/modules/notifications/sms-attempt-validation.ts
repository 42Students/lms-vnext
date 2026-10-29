/**
 * Runtime-safe DB-031 provider audit input. JavaScript callers can bypass
 * TypeScript unions, so no purpose, code, phone-derived suffix or provider
 * receipt may be persisted before the shape is checked.
 */
export type SmsAttemptCandidate = {
  purpose: string;
  recipient: string;
  outcome: string;
  providerSid?: string | null;
  failureCode?: string | null;
  sourceEventId?: string | null;
  collegeId?: string | null;
  organizationId?: string | null;
};

export type ValidSmsAttempt = {
  purpose: "otp" | "job.update" | "notification" |
    "attendance.absence" | "attendance.correction";
  suffix: string | null;
  outcome: "PROVIDER_ACCEPTED" | "FAILED";
  providerSid: string | null;
  failureCode: string | null;
  sourceEventId: string | null;
  collegeId: string | null;
  organizationId: string | null;
};

const PURPOSES = new Set<string>([
  "otp", "job.update", "notification", "attendance.absence",
  "attendance.correction",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const CODE = /^[A-Z0-9_]{1,40}$/;

function canonicalPhone(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.replace(/[\s()-]/g, "");
  if (/^[6-9][0-9]{9}$/.test(value)) return "+91" + value;
  if (/^91[6-9][0-9]{9}$/.test(value)) return "+" + value;
  return /^\+[1-9][0-9]{7,14}$/.test(value) ? value : null;
}

export function validatedSmsAttempt(
  input: SmsAttemptCandidate,
): ValidSmsAttempt | null {
  if (!input || typeof input !== "object" ||
      typeof input.purpose !== "string" || !PURPOSES.has(input.purpose) ||
      (input.outcome !== "PROVIDER_ACCEPTED" && input.outcome !== "FAILED") ||
      typeof input.recipient !== "string") return null;

  const ids = [input.sourceEventId, input.collegeId, input.organizationId];
  if (ids.some(id => id != null && (typeof id !== "string" || !UUID.test(id)))) {
    return null;
  }
  if (Boolean(input.collegeId) !== Boolean(input.organizationId)) return null;

  const phone = canonicalPhone(input.recipient);
  const sid = input.providerSid ?? null;
  const code = input.failureCode ?? null;
  if (input.outcome === "PROVIDER_ACCEPTED") {
    if (!phone || typeof sid !== "string" || !SID.test(sid) || code !== null) {
      return null;
    }
  } else if (sid !== null || typeof code !== "string" || !CODE.test(code)) {
    return null;
  }
  return {
    purpose: input.purpose as ValidSmsAttempt["purpose"],
    suffix: phone ? phone.slice(-4) : null,
    outcome: input.outcome,
    providerSid: sid,
    failureCode: code,
    sourceEventId: input.sourceEventId ?? null,
    collegeId: input.collegeId ?? null,
    organizationId: input.organizationId ?? null,
  };
}
