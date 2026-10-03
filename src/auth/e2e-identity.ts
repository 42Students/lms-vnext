export const E2E_IDENTITY_COOKIE_NAME =
  "lms_e2e_identity";
export const E2E_SECRET_COOKIE_NAME =
  "lms_e2e_secret";

const MIN_SECRET_LENGTH = 32;
const E2E_IDENTITY_UID_PATTERN =
  /^[A-Za-z0-9._:@-]{1,128}$/;

export type E2eIdentityInput = {
  nodeEnv: string | undefined;
  enabled: string | undefined;
  configuredSecret: string | undefined;
  cookieSecret: string | undefined;
  identityUid: string | undefined;
};

export function resolveE2eIdentityUid(
  input: E2eIdentityInput,
): string | null {
  if (
    input.nodeEnv === "production" ||
    input.enabled !== "true"
  ) {
    return null;
  }

  const configuredSecret = input.configuredSecret;
  if (
    !configuredSecret ||
    configuredSecret.length < MIN_SECRET_LENGTH ||
    input.cookieSecret !== configuredSecret
  ) {
    return null;
  }

  const identityUid = input.identityUid?.trim();
  if (
    !identityUid ||
    !E2E_IDENTITY_UID_PATTERN.test(identityUid)
  ) {
    return null;
  }

  return identityUid;
}
