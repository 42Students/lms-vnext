import { z } from "zod";
import type {
  EmailProvider,
  SmsProvider,
} from "@/modules/notifications/types";
import type { AuthConfig } from "./config";
import {
  codeMac,
  contactFingerprint,
  generateCode,
  maskEmail,
  maskPhone,
  safeEqualHex,
} from "./crypto";

/**
 * Phone / email one-time-code login, replicating the legacy LMS flow:
 * start -> (optional email fallback) -> verify. One human is one user, so a
 * verified code proves the person; the college is chosen afterwards (or fixed
 * by the college host).
 *
 * Hard rules:
 * - codes are stored only as keyed MACs and compared in constant time
 * - one atomic budget of 5 verification tries shared by SMS and email
 * - a challenge is single use and lives at most 5 minutes
 * - authorization is re-checked when the code is consumed
 * - test codes exist only when APP_ENV=development (see AuthConfig)
 */

export const ATTEMPT_LIFETIME_SECONDS = 300;
export const MAX_SENDS_PER_CONTACT = 5;
export const SEND_WINDOW_MINUTES = 10;
export const EMAIL_RESEND_GAP_SECONDS = 30;

export type LoginErrorCode =
  | "INVALID_CONTACT"
  | "NOT_REGISTERED"
  | "NO_ACCOUNT_FOR_DOMAIN"
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_SUSPENDED"
  | "TOO_MANY_REQUESTS"
  | "TOO_SOON"
  | "OTP_DELIVERY_FAILED"
  | "INVALID_ATTEMPT"
  | "OTP_EXPIRED"
  | "OTP_ATTEMPTS_EXCEEDED"
  | "INCORRECT_OTP"
  | "WRONG_TENANT"
  | "EMAIL_NOT_AVAILABLE";

const STATUS: Record<LoginErrorCode, number> = {
  INVALID_CONTACT: 400,
  NOT_REGISTERED: 404,
  NO_ACCOUNT_FOR_DOMAIN: 404,
  ACCOUNT_DISABLED: 403,
  ACCOUNT_SUSPENDED: 403,
  TOO_MANY_REQUESTS: 429,
  TOO_SOON: 429,
  OTP_DELIVERY_FAILED: 503,
  INVALID_ATTEMPT: 401,
  OTP_EXPIRED: 401,
  OTP_ATTEMPTS_EXCEEDED: 429,
  INCORRECT_OTP: 401,
  WRONG_TENANT: 403,
  EMAIL_NOT_AVAILABLE: 400,
};

export class LoginError extends Error {
  readonly status: number;
  constructor(
    public readonly code: LoginErrorCode,
    public readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = "LoginError";
    this.status = STATUS[code];
  }
}

export type LoginUser = {
  id: string;
  identityUid: string;
  phoneE164: string | null;
  email: string | null;
  displayName: string | null;
  platformStatus: "ACTIVE" | "DISABLED";
};

export type LoginMembership = {
  id: string;
  collegeId: string;
  status: "ACTIVE" | "SUSPENDED" | "ENDED";
};

export type AttemptRecord = {
  id: string;
  userId: string;
  collegeId: string | null;
  smsCodeMac: string | null;
  smsCodeExpiresAt: Date | null;
  emailCodeMac: string | null;
  emailCodeExpiresAt: Date | null;
  verificationAttempts: number;
  expiresAt: Date;
  usedAt: Date | null;
};

export interface LoginRepository {
  findUserByPhone(phoneE164: string): Promise<LoginUser | null>;
  findUserByEmail(email: string): Promise<LoginUser | null>;
  findUserById(userId: string): Promise<LoginUser | null>;
  listMemberships(userId: string): Promise<LoginMembership[]>;
  isSuperAdmin(userId: string): Promise<boolean>;
  /** True when the user is an active recruiter with a grant at the college. */
  hasRecruiterGrantAtCollege(
    userId: string,
    collegeId: string,
  ): Promise<boolean>;
  countRecentAttempts(
    fingerprint: string,
    windowMinutes: number,
  ): Promise<number>;
  /**
   * Inserts the challenge with created_at = now() and
   * expires_at = now() + 5 minutes evaluated by the database, so the
   * table's CHECK constraints can never be violated by clock skew.
   */
  createAttempt(input: {
    id: string;
    userId: string;
    collegeId: string | null;
    contactFingerprint: string;
    smsCodeMac: string | null;
    emailCodeMac: string | null;
  }): Promise<void>;
  loadAttempt(id: string): Promise<AttemptRecord | null>;
  /**
   * Replaces the email code when at least EMAIL_RESEND_GAP_SECONDS passed
   * since the previous one. Returns false when refused (too soon/expired).
   */
  setEmailCode(
    id: string,
    mac: string,
    gapSeconds: number,
  ): Promise<boolean>;
  /** Atomic: increments tries only while < 5, unused and unexpired. */
  reserveVerification(id: string): Promise<boolean>;
  /** Atomic single-winner consume; clears every code MAC. */
  consumeAttempt(id: string): Promise<boolean>;
}

export type LoginDependencies = {
  repository: LoginRepository;
  sms: SmsProvider;
  email: EmailProvider;
  config: AuthConfig;
  newId: () => string;
  now: () => Date;
};

const emailSchema = z.string().trim().toLowerCase().email().max(254);

export function normalizePhone(raw: string): string | null {
  const stripped = raw.replace(/[\s()-]/g, "");
  if (/^[0-9]{10}$/.test(stripped)) return `+91${stripped}`;
  if (/^91[0-9]{10}$/.test(stripped)) return `+${stripped}`;
  if (/^\+[1-9][0-9]{7,14}$/.test(stripped)) return stripped;
  return null;
}

export function normalizeEmail(raw: string): string | null {
  const parsed = emailSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export type StartLoginInput = {
  channel: "PHONE" | "EMAIL";
  contact: string;
  /** College implied by the request host, or null on the platform host. */
  tenantCollegeId: string | null;
};

export type StartLoginResult = {
  attemptId: string;
  channel: "PHONE" | "EMAIL";
  maskedContact: string;
  expiresInSeconds: number;
  emailFallbackAvailable: boolean;
  maskedEmail: string | null;
};

async function assertCanSignInHere(
  deps: LoginDependencies,
  user: LoginUser,
  tenantCollegeId: string | null,
) {
  if (user.platformStatus !== "ACTIVE") {
    throw new LoginError("ACCOUNT_DISABLED");
  }

  if (!tenantCollegeId) return;

  const memberships = await deps.repository.listMemberships(user.id);
  const here = memberships.find(
    (membership) => membership.collegeId === tenantCollegeId,
  );

  if (here) {
    if (here.status === "SUSPENDED") {
      throw new LoginError("ACCOUNT_SUSPENDED");
    }
    if (here.status === "ACTIVE") return;
  }

  if (
    await deps.repository.hasRecruiterGrantAtCollege(
      user.id,
      tenantCollegeId,
    )
  ) {
    return;
  }

  throw new LoginError("NO_ACCOUNT_FOR_DOMAIN");
}

export async function startLogin(
  input: StartLoginInput,
  deps: LoginDependencies,
): Promise<StartLoginResult> {
  const isPhone = input.channel === "PHONE";
  const normalized = isPhone
    ? normalizePhone(input.contact)
    : normalizeEmail(input.contact);

  if (!normalized) throw new LoginError("INVALID_CONTACT");

  const user = isPhone
    ? await deps.repository.findUserByPhone(normalized)
    : await deps.repository.findUserByEmail(normalized);

  if (!user) throw new LoginError("NOT_REGISTERED");

  await assertCanSignInHere(deps, user, input.tenantCollegeId);

  const fingerprint = contactFingerprint(
    deps.config.secret,
    isPhone ? "phone" : "email",
    normalized,
  );

  const recent = await deps.repository.countRecentAttempts(
    fingerprint,
    SEND_WINDOW_MINUTES,
  );
  if (recent >= MAX_SENDS_PER_CONTACT) {
    throw new LoginError("TOO_MANY_REQUESTS", SEND_WINDOW_MINUTES * 60);
  }

  const isTestContact = isPhone
    ? deps.config.testPhones.has(normalized)
    : deps.config.testEmails.has(normalized);
  const code =
    isTestContact && deps.config.testOtp
      ? deps.config.testOtp
      : generateCode();

  const attemptId = deps.newId();
  const mac = codeMac(
    deps.config.secret,
    isPhone ? "sms" : "email",
    attemptId,
    code,
  );

  await deps.repository.createAttempt({
    id: attemptId,
    userId: user.id,
    collegeId: input.tenantCollegeId,
    contactFingerprint: fingerprint,
    smsCodeMac: isPhone ? mac : null,
    emailCodeMac: isPhone ? null : mac,
  });

  if (!isTestContact) {
    const accepted = isPhone
      ? await deps.sms.sendOtp(normalized, code)
      : await deps.email.sendOtpEmail({
          toEmail: normalized,
          displayName: user.displayName ?? "there",
          code,
          phoneE164: user.phoneE164,
        });

    if (!accepted) throw new LoginError("OTP_DELIVERY_FAILED");
  }

  return {
    attemptId,
    channel: input.channel,
    maskedContact: isPhone
      ? maskPhone(normalized)
      : maskEmail(normalized),
    expiresInSeconds: ATTEMPT_LIFETIME_SECONDS,
    emailFallbackAvailable: isPhone && Boolean(user.email),
    maskedEmail: isPhone && user.email ? maskEmail(user.email) : null,
  };
}

async function loadLiveAttempt(
  deps: LoginDependencies,
  attemptId: string,
  tenantCollegeId: string | null,
) {
  const attempt = await deps.repository.loadAttempt(attemptId);

  if (!attempt || attempt.usedAt) throw new LoginError("INVALID_ATTEMPT");
  if (attempt.expiresAt.getTime() <= deps.now().getTime()) {
    throw new LoginError("OTP_EXPIRED");
  }
  if (attempt.collegeId !== tenantCollegeId) {
    throw new LoginError("WRONG_TENANT");
  }

  return attempt;
}

export async function sendEmailFallback(
  input: { attemptId: string; tenantCollegeId: string | null },
  deps: LoginDependencies,
) {
  const attempt = await loadLiveAttempt(
    deps,
    input.attemptId,
    input.tenantCollegeId,
  );
  const user = await deps.repository.findUserById(attempt.userId);

  if (!user || user.platformStatus !== "ACTIVE") {
    throw new LoginError("ACCOUNT_DISABLED");
  }
  if (!user.email) throw new LoginError("EMAIL_NOT_AVAILABLE");

  const isTestContact = deps.config.testEmails.has(
    user.email.toLowerCase(),
  );
  const code =
    isTestContact && deps.config.testOtp
      ? deps.config.testOtp
      : generateCode();

  const stored = await deps.repository.setEmailCode(
    attempt.id,
    codeMac(deps.config.secret, "email", attempt.id, code),
    EMAIL_RESEND_GAP_SECONDS,
  );
  if (!stored) {
    throw new LoginError("TOO_SOON", EMAIL_RESEND_GAP_SECONDS);
  }

  if (!isTestContact) {
    const accepted = await deps.email.sendOtpEmail({
      toEmail: user.email,
      displayName: user.displayName ?? "there",
      code,
      phoneE164: user.phoneE164,
    });
    if (!accepted) throw new LoginError("OTP_DELIVERY_FAILED");
  }

  return {
    attemptId: attempt.id,
    maskedEmail: maskEmail(user.email),
    expiresInSeconds: ATTEMPT_LIFETIME_SECONDS,
  };
}

export type VerifiedLogin = {
  user: LoginUser;
  memberships: LoginMembership[];
  isSuperAdmin: boolean;
  /** The membership implied by the college host, if any. */
  tenantMembershipId: string | null;
};

export async function verifyLogin(
  input: {
    attemptId: string;
    code: string;
    tenantCollegeId: string | null;
  },
  deps: LoginDependencies,
): Promise<VerifiedLogin> {
  const attempt = await loadLiveAttempt(
    deps,
    input.attemptId,
    input.tenantCollegeId,
  );

  // One shared, atomic budget across SMS and email.
  const reserved = await deps.repository.reserveVerification(attempt.id);
  if (!reserved) throw new LoginError("OTP_ATTEMPTS_EXCEEDED");

  const now = deps.now().getTime();
  const candidates: string[] = [];
  if (
    attempt.smsCodeMac &&
    attempt.smsCodeExpiresAt &&
    attempt.smsCodeExpiresAt.getTime() > now
  ) {
    candidates.push(attempt.smsCodeMac);
  }
  if (
    attempt.emailCodeMac &&
    attempt.emailCodeExpiresAt &&
    attempt.emailCodeExpiresAt.getTime() > now
  ) {
    candidates.push(attempt.emailCodeMac);
  }

  const submitted = input.code.trim();
  let matched = false;
  for (const stored of candidates) {
    const channel = stored === attempt.smsCodeMac ? "sms" : "email";
    const attemptMac = codeMac(
      deps.config.secret,
      channel,
      attempt.id,
      submitted,
    );
    // Evaluate every candidate so timing does not reveal which matched.
    if (safeEqualHex(attemptMac, stored)) matched = true;
  }

  if (!matched) throw new LoginError("INCORRECT_OTP");

  // Authorization is checked at consume time, not just at issue time.
  const user = await deps.repository.findUserById(attempt.userId);
  if (!user) throw new LoginError("INVALID_ATTEMPT");
  await assertCanSignInHere(deps, user, input.tenantCollegeId);

  const consumed = await deps.repository.consumeAttempt(attempt.id);
  if (!consumed) throw new LoginError("INVALID_ATTEMPT");

  const memberships = await deps.repository.listMemberships(user.id);
  const tenantMembership = input.tenantCollegeId
    ? memberships.find(
        (membership) =>
          membership.collegeId === input.tenantCollegeId &&
          membership.status === "ACTIVE",
      )
    : undefined;

  return {
    user,
    memberships,
    isSuperAdmin: await deps.repository.isSuperAdmin(user.id),
    tenantMembershipId: tenantMembership?.id ?? null,
  };
}
