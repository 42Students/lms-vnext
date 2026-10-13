/**
 * Runtime configuration for first-party login (phone / email one-time codes).
 *
 * Everything is read lazily from the environment so unit tests can supply
 * their own values and so a missing secret fails closed at first use rather
 * than at import time.
 */

export type AuthConfig = {
  /** Keyed-MAC secret for codes, contact fingerprints and session digests. */
  secret: string;
  appEnv: "development" | "production";
  /**
   * Fixed code for listed QA phones/emails. Only ever populated when
   * APP_ENV=development; production can never accept it.
   */
  testOtp: string | null;
  testPhones: ReadonlySet<string>;
  testEmails: ReadonlySet<string>;
  /** Hosts that are the platform itself (no college is implied). */
  platformHosts: ReadonlySet<string>;
  sessionMaxAgeSeconds: number;
};

export const MIN_AUTH_SECRET_LENGTH = 32;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

function list(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function readAuthConfig(
  env: Record<string, string | undefined> = process.env,
): AuthConfig {
  const secret = env.AUTH_SECRET ?? "";

  if (secret.length < MIN_AUTH_SECRET_LENGTH) {
    throw new AuthConfigError(
      `AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters`,
    );
  }

  const appEnv =
    env.APP_ENV === "development" ? "development" : "production";

  const testOtp =
    appEnv === "development" && /^[0-9]{6}$/.test(env.AUTH_TEST_OTP ?? "")
      ? (env.AUTH_TEST_OTP as string)
      : null;

  return {
    secret,
    appEnv,
    testOtp,
    testPhones: testOtp ? list(env.AUTH_TEST_PHONES) : new Set(),
    testEmails: testOtp ? list(env.AUTH_TEST_EMAILS) : new Set(),
    platformHosts: list(
      env.PLATFORM_HOSTS ?? "localhost,127.0.0.1",
    ),
    sessionMaxAgeSeconds: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Hosts that mean "the platform itself". Deliberately independent of
 * AUTH_SECRET: resolving which tenant a request belongs to must keep working
 * (and keep failing closed) even where sign-in is not configured.
 */
export function getPlatformHosts(
  env: Record<string, string | undefined> = process.env,
): ReadonlySet<string> {
  return list(env.PLATFORM_HOSTS ?? "localhost,127.0.0.1");
}

let cached: AuthConfig | null = null;

export function getAuthConfig() {
  cached ??= readAuthConfig();
  return cached;
}

/** For tests only. */
export function resetAuthConfigForTests() {
  cached = null;
}
