import {
  describe,
  expect,
  it,
} from "vitest";
import {
  resolveE2eIdentityUid,
} from "@/auth/e2e-identity";

const secret =
  "0123456789abcdef0123456789abcdef";

describe("E2E identity harness", () => {
  it("accepts a valid non-production secret-gated identity", () => {
    expect(
      resolveE2eIdentityUid({
        nodeEnv: "test",
        enabled: "true",
        configuredSecret: secret,
        cookieSecret: secret,
        identityUid: "seed-shared-faculty",
      }),
    ).toBe("seed-shared-faculty");
  });

  it("stays disabled unless explicitly enabled", () => {
    expect(
      resolveE2eIdentityUid({
        nodeEnv: "test",
        enabled: undefined,
        configuredSecret: secret,
        cookieSecret: secret,
        identityUid: "seed-learner",
      }),
    ).toBeNull();
  });

  it("rejects missing, short, or incorrect secrets", () => {
    expect(
      resolveE2eIdentityUid({
        nodeEnv: "test",
        enabled: "true",
        configuredSecret: undefined,
        cookieSecret: secret,
        identityUid: "seed-learner",
      }),
    ).toBeNull();

    expect(
      resolveE2eIdentityUid({
        nodeEnv: "test",
        enabled: "true",
        configuredSecret: "too-short",
        cookieSecret: "too-short",
        identityUid: "seed-learner",
      }),
    ).toBeNull();

    expect(
      resolveE2eIdentityUid({
        nodeEnv: "test",
        enabled: "true",
        configuredSecret: secret,
        cookieSecret:
          "abcdef0123456789abcdef0123456789",
        identityUid: "seed-learner",
      }),
    ).toBeNull();
  });

  it("rejects malformed identity UIDs", () => {
    expect(
      resolveE2eIdentityUid({
        nodeEnv: "test",
        enabled: "true",
        configuredSecret: secret,
        cookieSecret: secret,
        identityUid: "seed learner\nadmin",
      }),
    ).toBeNull();
  });

  it("is unconditionally disabled in production", () => {
    expect(
      resolveE2eIdentityUid({
        nodeEnv: "production",
        enabled: "true",
        configuredSecret: secret,
        cookieSecret: secret,
        identityUid: "seed-superadmin",
      }),
    ).toBeNull();
  });
});
