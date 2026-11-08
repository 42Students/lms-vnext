import { randomUUID } from "node:crypto";
import { maskEmail, maskPhone } from "@/modules/auth/crypto";
import { LoginError, normalizeEmail, normalizePhone } from "@/modules/auth/login-service";

/**
 * Account enumeration control (SEC-01-003). With AUTH_UNIFORM_UNKNOWN_CONTACT=1
 * the sign-in start answers an unknown, disabled or out-of-college contact the
 * same way as a real one: a never-stored attempt id that can never verify.
 * Off by default because the legacy product tells people "not registered";
 * switching it on is a wording decision (see OWNER-ACTIONS).
 */
const MASKED_CODES = new Set(["NOT_REGISTERED", "NO_ACCOUNT_FOR_DOMAIN", "ACCOUNT_DISABLED", "ACCOUNT_SUSPENDED"]);
const FLOOR_MS = 350;

export function uniformStartEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.AUTH_UNIFORM_UNKNOWN_CONTACT === "1";
}

export function isMaskedStartError(error: unknown): error is LoginError {
  return error instanceof LoginError && MASKED_CODES.has(error.code);
}

/** Same shape as a real start result; the attempt id exists nowhere. */
export function decoyStartResult(channel: "PHONE" | "EMAIL", contact: string) {
  const isPhone = channel === "PHONE";
  const normalized = isPhone ? normalizePhone(contact) : normalizeEmail(contact);
  return {
    attemptId: randomUUID(),
    channel,
    mode: isPhone ? ("PHONE_OTP_SENT" as const) : ("EMAIL_OTP_SENT" as const),
    maskedContact: normalized ? (isPhone ? maskPhone(normalized) : maskEmail(normalized)) : "",
    expiresInSeconds: 300,
    emailFallbackAvailable: false,
    maskedEmail: null,
    requiresSecondFactor: false,
    maskedPhone: null,
  };
}

/** Pads the fast decoy path so response time does not reveal that no code was sent. */
export async function padToFloor(startedAt: number, now: () => number = Date.now) {
  const wait = FLOOR_MS - (now() - startedAt) + Math.floor(Math.random() * 120);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}
