import { z } from "zod";
import type {
  EmailProvider,
  SmsProvider,
} from "@/modules/notifications/types";
import { publicWorkEmailIssue } from "@/modules/placements/public-work-email-policy";
import type { AuthConfig } from "./config";
import {
  codeMac,
  contactFingerprint,
  generateCode,
  maskEmail,
  maskPhone,
  generateToken,
  safeEqualHex,
  sessionDigest,
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
/** Per contact and requesting address: a person always keeps their own budget. */
export const MAX_SENDS_PER_CONTACT = 5;
/** Per contact across all addresses: bounds SMS cost and OTP guessing. */
export const MAX_SENDS_PER_CONTACT_TOTAL = 8;
/** Per requesting address across all contacts: bounds SMS pumping. */
export const MAX_SENDS_PER_ADDRESS = 20;
export const SEND_WINDOW_MINUTES = 10;
export const EMAIL_RESEND_GAP_SECONDS = 30;
/** Hard cap on email re-sends per challenge (resend_attempts column). */
export const MAX_EMAIL_RESENDS = 5;
/** Coarse shared bucket for requests whose address could not be determined. */
export const UNKNOWN_ADDRESS_TAG = "unknown-address";

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
  | "EMAIL_OTP_EXPIRED"
  | "OTP_ATTEMPTS_EXCEEDED"
  | "INCORRECT_OTP"
  | "WRONG_TENANT"
  | "EMAIL_NOT_AVAILABLE"
  | "CHANNEL_DISABLED"
  | "SECOND_FACTOR_REQUIRED"
  | "SECOND_FACTOR_UNAVAILABLE";

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
  EMAIL_OTP_EXPIRED: 401,
  OTP_ATTEMPTS_EXCEEDED: 429,
  INCORRECT_OTP: 401,
  WRONG_TENANT: 403,
  EMAIL_NOT_AVAILABLE: 400,
  CHANNEL_DISABLED: 403,
  SECOND_FACTOR_REQUIRED: 401,
  SECOND_FACTOR_UNAVAILABLE: 403,
};

/**
 * Public-safe legacy wording. API codes and HTTP statuses remain stable;
 * avoid echoing phone, email, verification codes or tenant membership facts.
 */
export function loginErrorMessage(code: LoginErrorCode): string {
  switch (code) {
    case "ACCOUNT_SUSPENDED":
      return "Contact your college administrator";
    case "OTP_DELIVERY_FAILED":
      return "Could not send the login code. Please try again.";
    case "TOO_SOON":
      return "A code was just sent. Wait a few seconds before asking for another.";
    case "TOO_MANY_REQUESTS":
      return "Too many OTP requests. Please try again later.";
    case "EMAIL_NOT_AVAILABLE":
      return "Email not found";
    case "EMAIL_OTP_EXPIRED":
      return "The email code has expired. Please request another code.";
    case "OTP_EXPIRED":
      return "The login code has expired. Please request another code.";
    case "OTP_ATTEMPTS_EXCEEDED":
      return "Too many verification attempts. Please try again later.";
    case "INCORRECT_OTP":
      return "Incorrect login code. Please try again.";
    case "INVALID_CONTACT":
      return "Enter a valid mobile number or email address.";
    case "ACCOUNT_DISABLED":
      return "This account is disabled. Contact your administrator.";
    case "WRONG_TENANT":
      return "This code cannot be used for this college.";
    case "SECOND_FACTOR_REQUIRED":
      return "Enter the email verification code to complete sign-in.";
    case "SECOND_FACTOR_UNAVAILABLE":
      return "Two-factor verification is unavailable for this account.";
    case "CHANNEL_DISABLED":
      return "This sign-in method is disabled.";
    case "NOT_REGISTERED":
    case "NO_ACCOUNT_FOR_DOMAIN":
      return "Sign-in is not available for these details.";
    case "INVALID_ATTEMPT":
      return "This login attempt is no longer valid. Request a new code.";
  }
}

export class LoginError extends Error {
  readonly status: number;
  constructor(
    public readonly code: LoginErrorCode,
    public readonly retryAfterSeconds?: number,
  ) {
    super(loginErrorMessage(code));
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
  emailCodeSentAt?: Date | null;
  resendAttempts?: number;
  verificationAttempts: number;
  expiresAt: Date;
  usedAt: Date | null;
  /** Database clock at load time; expiry is judged against this when present. */
  dbNow?: Date;
};

export type SessionIssue = {
  /** keyed digest of the new opaque token */
  digest: string;
  maxAgeSeconds: number;
  userAgent?: string | null;
  ipAddress?: string | null;
  /** digest of the session cookie being replaced; revoked in the same transaction */
  previousDigest?: string | null;
};

export interface LoginRepository {
  findUserByPhone(phoneE164: string): Promise<LoginUser | null>;
  findUserByEmail(email: string): Promise<LoginUser | null>;
  findUserById(userId: string): Promise<LoginUser | null>;
  listMemberships(userId: string): Promise<LoginMembership[]>;
  isSuperAdmin(userId: string): Promise<boolean>;
  /** True when the user is an active recruiter with any active college grant. */
  hasAnyRecruiterGrant(userId: string): Promise<boolean>;
  /** True when the user is an active recruiter with a grant at the college. */
  hasRecruiterGrantAtCollege(
    userId: string,
    collegeId: string,
  ): Promise<boolean>;
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
    /** Re-checked under locks; false means a cap was hit. */
    ipTag: string | null;
    rateLimit: {
      windowMinutes: number;
      perContactAndAddress: number;
      perContact: number;
      perAddress: number;
    };
  }): Promise<boolean>;
  loadAttempt(id: string): Promise<AttemptRecord | null>;
  /** Cancel a definitely rejected initial send, retaining rate-limit history. */
  invalidateUndeliveredAttempt?(id:string):Promise<void>;
  /**
   * Replaces the email code when at least EMAIL_RESEND_GAP_SECONDS passed
   * since the previous one. Returns false when refused (too soon/expired).
   */
  setEmailCode(
    id: string,
    mac: string,
    gapSeconds: number,
    maxResends?: number,
  ): Promise<boolean>;
  /** Only use after an explicit provider rejection, never an ambiguous timeout. */
  releaseUndeliveredEmailCode?(id:string,mac:string):Promise<void>;
  /** Atomic: increments tries only while < 5, unused and unexpired. */
  reserveVerification(id: string): Promise<boolean>;
  /**
   * Atomic single-winner consume; clears every code MAC. When `session` is
   * given, the device session is created (and the previous one revoked) in the
   * same transaction, so a failed insert never burns the code.
   */
  consumeAttempt(
    id: string,
    userId?: string,
    session?: SessionIssue,
  ): Promise<boolean>;
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

/** Staff-only support contract. Contact never belongs in a URL or audit log. */
export const adminOtpLockoutResetSchema = z.strictObject({
  phone: z.string().trim().min(8).max(32),
  reason: z.string().trim().min(10).max(500),
});

export type StartLoginInput = {
  channel: "PHONE" | "EMAIL";
  contact: string;
  /** College implied by the request host, or null on the platform host. */
  tenantCollegeId: string | null;
  /** One-way tag of the requesting address, for the per-requester send caps. */
  ipTag?: string | null;
};

export type StartLoginResult = {
  attemptId: string;
  /** Additive legacy success alias, without replacing the channel field. */
  mode?: "PHONE_OTP_SENT" | "EMAIL_OTP_SENT";
  channel: "PHONE" | "EMAIL";
  maskedContact: string;
  expiresInSeconds: number;
  emailFallbackAvailable: boolean;
  maskedEmail: string | null;
  /**
   * Platform administrators must prove both their phone and their email:
   * the challenge sent one code to each and sign-in needs both.
   */
  requiresSecondFactor: boolean;
  maskedPhone: string | null;
};

async function assertCanSignInHere(
  deps: LoginDependencies,
  user: LoginUser,
  tenantCollegeId: string | null,
) {
  if (user.platformStatus !== "ACTIVE") {
    throw new LoginError("ACCOUNT_DISABLED");
  }

  const memberships = await deps.repository.listMemberships(user.id);

  if (!tenantCollegeId) {
    // Platform host: a person must still hold something that grants access,
    // never only suspended or ended memberships.
    if (memberships.some((membership) => membership.status === "ACTIVE")) {
      return;
    }
    if (await deps.repository.isSuperAdmin(user.id)) return;
    if (await deps.repository.hasAnyRecruiterGrant(user.id)) return;
    if (memberships.some((membership) => membership.status === "SUSPENDED")) {
      throw new LoginError("ACCOUNT_SUSPENDED");
    }
    throw new LoginError("NO_ACCOUNT_FOR_DOMAIN");
  }

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

/**
 * Corporate-email policy applies only when the person has no active college
 * membership or platform role and is signing in solely via a recruiter grant.
 * Never reject a learner's email just because that learner also holds a
 * recruiter grant. Do not reveal grant existence or the blocked domain.
 *
 * This classification reuses the maintained work-email denylist; verified
 * recruiter grant issuance and company-domain exceptions remain separate
 * authorized onboarding decisions, not public login parameters.
 */
async function assertRecruiterOnlyWorkEmail(
  deps: LoginDependencies,
  user: LoginUser,
) {
  const memberships = await deps.repository.listMemberships(user.id);
  if (memberships.some(membership => membership.status === "ACTIVE")) return;
  if (await deps.repository.isSuperAdmin(user.id)) return;
  if (!(await deps.repository.hasAnyRecruiterGrant(user.id))) return;
  if (!user.email || publicWorkEmailIssue(user.email) !== null) {
    throw new LoginError("NO_ACCOUNT_FOR_DOMAIN");
  }
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
  await assertRecruiterOnlyWorkEmail(deps, user);

  const fingerprint = contactFingerprint(
    deps.config.secret,
    isPhone ? "phone" : "email",
    normalized,
  );

  const strong = await deps.repository.isSuperAdmin(user.id);
  if (strong && (!user.phoneE164 || !user.email)) {
    // Policy: a platform administrator needs two independently verified
    // contacts. Never fall back to a single factor.
    throw new LoginError("SECOND_FACTOR_UNAVAILABLE");
  }

  const pick = (testSet: ReadonlySet<string>, contact: string) => {
    const isTest = testSet.has(contact);
    return {
      isTest,
      code: isTest && deps.config.testOtp ? deps.config.testOtp : generateCode(),
    };
  };

  const attemptId = deps.newId();
  const phoneContact = strong ? user.phoneE164! : isPhone ? normalized : null;
  const emailContact = strong ? user.email!.toLowerCase() : isPhone ? null : normalized;
  const sms = phoneContact ? pick(deps.config.testPhones, phoneContact) : null;
  const mail = emailContact ? pick(deps.config.testEmails, emailContact) : null;

  const created = await deps.repository.createAttempt({
    id: attemptId,
    userId: user.id,
    collegeId: input.tenantCollegeId,
    contactFingerprint: fingerprint,
    smsCodeMac: sms ? codeMac(deps.config.secret, "sms", attemptId, sms.code) : null,
    emailCodeMac: mail ? codeMac(deps.config.secret, "email", attemptId, mail.code) : null,
    // Never skip the per-address cap: unknown addresses share one coarse bucket.
    ipTag: input.ipTag ?? UNKNOWN_ADDRESS_TAG,
    rateLimit: {
      windowMinutes: SEND_WINDOW_MINUTES,
      perContactAndAddress: MAX_SENDS_PER_CONTACT,
      perContact: MAX_SENDS_PER_CONTACT_TOTAL,
      perAddress: MAX_SENDS_PER_ADDRESS,
    },
  });
  if (!created) {
    throw new LoginError("TOO_MANY_REQUESTS", SEND_WINDOW_MINUTES * 60);
  }

  if (sms && phoneContact && !sms.isTest) {
    let accepted=false;
    let confirmedRejection=false;
    try {accepted=await deps.sms.sendOtp(phoneContact,sms.code);confirmedRejection=!accepted;}
    catch {/* Gateway may have sent; do not allow immediate retries. */}
    if(!accepted){
      if(confirmedRejection)await deps.repository.invalidateUndeliveredAttempt?.(attemptId);
      throw new LoginError("OTP_DELIVERY_FAILED");
    }
  }
  if (mail && emailContact && !mail.isTest) {
    let accepted=false;
    let confirmedRejection=false;
    try{
      accepted=await deps.email.sendOtpEmail({
        toEmail:emailContact,displayName:user.displayName??"there",
        code:mail.code,phoneE164:user.phoneE164,
      });
      confirmedRejection=!accepted;
    }catch{/* Gateway may have accepted the send; enforce normal cooldown. */}
    if(!accepted){
      if(confirmedRejection)await deps.repository.invalidateUndeliveredAttempt?.(attemptId);
      throw new LoginError("OTP_DELIVERY_FAILED");
    }
  }

  return {
    attemptId,
    channel: input.channel,
    mode: isPhone ? "PHONE_OTP_SENT" : "EMAIL_OTP_SENT",
    maskedContact: isPhone ? maskPhone(normalized) : maskEmail(normalized),
    expiresInSeconds: ATTEMPT_LIFETIME_SECONDS,
    emailFallbackAvailable: isPhone && Boolean(user.email),
    maskedEmail:
      (isPhone || strong) && user.email ? maskEmail(user.email) : null,
    requiresSecondFactor: strong,
    maskedPhone: user.phoneE164 ? maskPhone(user.phoneE164) : null,
  };
}

async function loadLiveAttempt(
  deps: LoginDependencies,
  attemptId: string,
  tenantCollegeId: string | null,
) {
  const attempt = await deps.repository.loadAttempt(attemptId);

  if (!attempt || attempt.usedAt) throw new LoginError("INVALID_ATTEMPT");
  const clock = (attempt.dbNow ?? deps.now()).getTime();
  if (attempt.expiresAt.getTime() <= clock) {
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
  await assertRecruiterOnlyWorkEmail(deps, user);

  const isTestContact = deps.config.testEmails.has(
    user.email.toLowerCase(),
  );
  const code =
    isTestContact && deps.config.testOtp
      ? deps.config.testOtp
      : generateCode();

  const emailMac=codeMac(deps.config.secret,"email",attempt.id,code);
  const stored = await deps.repository.setEmailCode(
    attempt.id,emailMac,EMAIL_RESEND_GAP_SECONDS,MAX_EMAIL_RESENDS,
  );
  if (!stored) {
    const latest=await deps.repository.loadAttempt(attempt.id);
    if((latest?.resendAttempts??0)>=MAX_EMAIL_RESENDS){
      throw new LoginError("TOO_MANY_REQUESTS",SEND_WINDOW_MINUTES*60);
    }
    const remaining=latest?.emailCodeSentAt
      ?Math.max(1,Math.ceil((latest!.emailCodeSentAt!.getTime()
        +EMAIL_RESEND_GAP_SECONDS*1000-(latest?.dbNow??deps.now()).getTime())/1000))
      :EMAIL_RESEND_GAP_SECONDS;
    throw new LoginError("TOO_SOON",Math.min(EMAIL_RESEND_GAP_SECONDS,remaining));
  }

  if (!isTestContact) {
    let accepted:boolean;
    try {
      accepted=await deps.email.sendOtpEmail({
        toEmail:user.email,displayName:user.displayName??"there",
        code,phoneE164:user.phoneE164,
      });
    } catch {
      // The provider may have accepted a timed-out send: do not release it
      // for an immediate duplicate. Retry only after the cooldown.
      throw new LoginError("OTP_DELIVERY_FAILED");
    }
    if(!accepted){
      try{await deps.repository.releaseUndeliveredEmailCode?.(attempt.id,emailMac);}
      catch{/* Fail closed: remaining code expires normally. */}
      throw new LoginError("OTP_DELIVERY_FAILED");
    }
  }

  // A fallback cannot outlive its parent challenge: report the real remaining
  // expiry instead of incorrectly promising a fresh five minutes.
  const remainingSeconds = Math.max(
    0,
    Math.min(
      ATTEMPT_LIFETIME_SECONDS,
      Math.floor((attempt.expiresAt.getTime() - deps.now().getTime()) / 1000),
    ),
  );
  return {
    mode: "EMAIL_OTP_SENT" as const,
    attemptId: attempt.id,
    maskedEmail: maskEmail(user.email),
    expiresInSeconds: remainingSeconds,
  };
}

export type VerifiedLogin = {
  user: LoginUser;
  memberships: LoginMembership[];
  isSuperAdmin: boolean;
  /** The membership implied by the college host, if any. */
  tenantMembershipId: string | null;
  /** Present when a session was requested; created atomically with the consume. */
  session: { token: string; maxAgeSeconds: number } | null;
};

export async function verifyLogin(
  input: {
    attemptId: string;
    code: string;
    /** Email code; required when the account is a platform administrator. */
    secondCode?: string;
    tenantCollegeId: string | null;
    /** When set, the device session is issued in the same transaction as the consume. */
    session?: {
      userAgent?: string | null;
      ipAddress?: string | null;
      maxAgeSeconds: number;
      previousToken?: string | null;
    };
  },
  deps: LoginDependencies,
): Promise<VerifiedLogin> {
  const attempt = await loadLiveAttempt(
    deps,
    input.attemptId,
    input.tenantCollegeId,
  );

  // A missing second factor is a request error, not a guess: reject it
  // before it can spend the shared verification budget.
  const strong = await deps.repository.isSuperAdmin(attempt.userId);
  if (strong && !input.secondCode) {
    throw new LoginError("SECOND_FACTOR_REQUIRED");
  }

  // One shared, atomic budget across SMS and email.
  const reserved = await deps.repository.reserveVerification(attempt.id);
  if (!reserved) {
    // Re-load to report the real reason instead of always "attempts exceeded".
    const fresh = await deps.repository.loadAttempt(attempt.id);
    if (!fresh || fresh.usedAt) throw new LoginError("INVALID_ATTEMPT");
    const freshClock = (fresh.dbNow ?? deps.now()).getTime();
    if (fresh.expiresAt.getTime() <= freshClock) {
      throw new LoginError("OTP_EXPIRED");
    }
    if (fresh.verificationAttempts >= 5) {
      throw new LoginError("OTP_ATTEMPTS_EXCEEDED");
    }
    throw new LoginError("INVALID_ATTEMPT");
  }

  const now = (attempt.dbNow ?? deps.now()).getTime();
  const live = (mac: string | null, expiresAt: Date | null) =>
    mac !== null && expiresAt !== null && expiresAt.getTime() > now
      ? mac
      : null;
  const smsMac = live(attempt.smsCodeMac, attempt.smsCodeExpiresAt);
  const emailMac = live(attempt.emailCodeMac, attempt.emailCodeExpiresAt);

  const matches = (
    channel: "sms" | "email",
    stored: string | null,
    submittedCode: string,
  ) =>
    stored !== null &&
    safeEqualHex(
      codeMac(deps.config.secret, channel, attempt.id, submittedCode.trim()),
      stored,
    );

  if (strong) {
    // Both factors must match, each against its own channel.
    // Evaluate both so timing does not reveal which failed.
    const smsOk = matches("sms", smsMac, input.code);
    const emailOk = matches("email", emailMac, input.secondCode ?? "");
    if (!(smsOk && emailOk)) {
      if (attempt.emailCodeMac && attempt.emailCodeExpiresAt &&
          attempt.emailCodeExpiresAt.getTime() <= now) {
        throw new LoginError("EMAIL_OTP_EXPIRED");
      }
      throw new LoginError("INCORRECT_OTP");
    }
  } else {
    // Either channel's code is enough for everyone else.
    const smsOk = matches("sms", smsMac, input.code);
    const emailOk = matches("email", emailMac, input.code);
    if (!(smsOk || emailOk)) {
      if (!smsMac && attempt.emailCodeMac && attempt.emailCodeExpiresAt &&
          attempt.emailCodeExpiresAt.getTime() <= now) {
        throw new LoginError("EMAIL_OTP_EXPIRED");
      }
      throw new LoginError("INCORRECT_OTP");
    }
  }

  // Authorization is checked at consume time, not just at issue time.
  const user = await deps.repository.findUserById(attempt.userId);
  if (!user) throw new LoginError("INVALID_ATTEMPT");
  await assertCanSignInHere(deps, user, input.tenantCollegeId);
  await assertRecruiterOnlyWorkEmail(deps, user);

  let issued: { token: string; maxAgeSeconds: number } | null = null;
  let sessionIssue: SessionIssue | undefined;
  if (input.session) {
    const token = generateToken();
    issued = { token, maxAgeSeconds: input.session.maxAgeSeconds };
    sessionIssue = {
      digest: sessionDigest(deps.config.secret, token),
      maxAgeSeconds: input.session.maxAgeSeconds,
      userAgent: input.session.userAgent ?? null,
      ipAddress: input.session.ipAddress ?? null,
      previousDigest: input.session.previousToken
        ? sessionDigest(deps.config.secret, input.session.previousToken)
        : null,
    };
  }
  const consumed = await deps.repository.consumeAttempt(
    attempt.id,
    user.id,
    sessionIssue,
  );
  if (!consumed) throw new LoginError("INVALID_ATTEMPT");

  // A user may hold several role and college memberships. Preserve the
  // separate selected-college actor while keeping the chooser order stable.
  const memberships = [...(await deps.repository.listMemberships(user.id))].sort((a,b)=>
    (a.status==="ACTIVE"?0:a.status==="SUSPENDED"?1:2)-
    (b.status==="ACTIVE"?0:b.status==="SUSPENDED"?1:2)||
    a.collegeId.localeCompare(b.collegeId)||a.id.localeCompare(b.id));
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
    session: issued,
  };
}
