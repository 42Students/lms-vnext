import { describe, expect, it } from "vitest";
import { getPlatformHosts, readAuthConfig } from "@/modules/auth/config";
import {
  LoginError,
  normalizeEmail,
  normalizePhone,
  sendEmailFallback,
  startLogin,
  verifyLogin,
  type AttemptRecord,
  type SessionIssue,
  type LoginDependencies,
  type LoginMembership,
  type LoginRepository,
  type LoginUser,
} from "@/modules/auth/login-service";

const SECRET = "x".repeat(40);
const COLLEGE_A = "college-a";
const COLLEGE_B = "college-b";

const learner: LoginUser = {
  id: "user-1",
  identityUid: "uid-1",
  phoneE164: "+919100060001",
  email: "learner@example.test",
  displayName: "Test Learner",
  platformStatus: "ACTIVE",
};

class FakeRepository implements LoginRepository {
  users: LoginUser[] = [learner];
  memberships: Record<string, LoginMembership[]> = {
    "user-1": [{ id: "m-1", collegeId: COLLEGE_A, status: "ACTIVE" }],
  };
  superAdmins = new Set<string>();
  recruiterGrants = new Set<string>();
  attempts = new Map<string, AttemptRecord & { fingerprint: string; ipTag: string | null; emailSentAt: Date | null; resends?: number }>();
  now = new Date("2026-10-13T10:00:00Z");

  async findUserByPhone(phone: string) {
    return this.users.find((u) => u.phoneE164 === phone) ?? null;
  }
  async findUserByEmail(email: string) {
    return this.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  }
  async findUserById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async listMemberships(userId: string) {
    return this.memberships[userId] ?? [];
  }
  async isSuperAdmin(userId: string) {
    return this.superAdmins.has(userId);
  }
  async hasAnyRecruiterGrant(userId: string) {
    return [...this.recruiterGrants].some((g) => g.startsWith(`${userId}:`));
  }
  async hasRecruiterGrantAtCollege(userId: string, collegeId: string) {
    return this.recruiterGrants.has(`${userId}:${collegeId}`);
  }
  async createAttempt(input: {
    id: string;
    userId: string;
    collegeId: string | null;
    contactFingerprint: string;
    smsCodeMac: string | null;
    emailCodeMac: string | null;
    ipTag: string | null;
    rateLimit: {
      windowMinutes: number;
      perContactAndAddress: number;
      perContact: number;
      perAddress: number;
    };
  }) {
    const all = [...this.attempts.values()];
    const forContact = all.filter((a) => a.fingerprint === input.contactFingerprint);
    if (
      forContact.filter((a) => a.ipTag === input.ipTag).length >=
        input.rateLimit.perContactAndAddress ||
      forContact.length >= input.rateLimit.perContact ||
      (input.ipTag !== null &&
        all.filter((a) => a.ipTag === input.ipTag).length >=
          input.rateLimit.perAddress)
    ) {
      return false;
    }
    const expires = new Date(this.now.getTime() + 300_000);
    this.attempts.set(input.id, {
      id: input.id,
      userId: input.userId,
      collegeId: input.collegeId,
      smsCodeMac: input.smsCodeMac,
      smsCodeExpiresAt: input.smsCodeMac ? expires : null,
      emailCodeMac: input.emailCodeMac,
      emailCodeExpiresAt: input.emailCodeMac ? expires : null,
      verificationAttempts: 0,
      expiresAt: expires,
      usedAt: null,
      fingerprint: input.contactFingerprint,
      ipTag: input.ipTag,
      emailSentAt: input.emailCodeMac ? this.now : null,
    });
    return true;
  }
  async loadAttempt(id: string) {
    const a = this.attempts.get(id);
    return a ? { ...a } : null;
  }
  async setEmailCode(id: string, mac: string, gapSeconds: number, maxResends = 5) {
    if ((this.attempts.get(id)?.resends ?? 0) >= maxResends) return false;
    const a = this.attempts.get(id);
    if (!a || a.usedAt || a.expiresAt <= this.now) return false;
    if (
      a.emailSentAt &&
      this.now.getTime() - a.emailSentAt.getTime() < gapSeconds * 1000
    ) {
      return false;
    }
    a.emailCodeMac = mac;
    a.emailCodeExpiresAt = a.expiresAt;
    a.emailSentAt = this.now;
    a.resends = (a.resends ?? 0) + 1;
    return true;
  }
  async reserveVerification(id: string) {
    const a = this.attempts.get(id);
    if (!a || a.usedAt || a.expiresAt <= this.now || a.verificationAttempts >= 5) {
      return false;
    }
    a.verificationAttempts += 1;
    return true;
  }
  failSessionInsert = false;
  sessions: { userId: string; digest: string; previousDigest?: string | null }[] = [];
  async consumeAttempt(id: string, userId?: string, session?: SessionIssue) {
    const a = this.attempts.get(id);
    if (!a || a.usedAt || a.expiresAt <= this.now) return false;
    if (session) {
      // Transactional: a failing insert leaves the attempt unused.
      if (this.failSessionInsert) throw new Error("insert failed");
      this.sessions.push({ userId: userId!, digest: session.digest, previousDigest: session.previousDigest });
    }
    a.usedAt = this.now;
    a.smsCodeMac = a.emailCodeMac = null;
    a.smsCodeExpiresAt = a.emailCodeExpiresAt = null;
    return true;
  }
}

function setup(env: Record<string, string> = {}) {
  const repository = new FakeRepository();
  const sent: { channel: string; to: string; code: string }[] = [];
  let ids = 0;
  const deps: LoginDependencies = {
    repository,
    sms: {
      async sendOtp(phone, code) {
        sent.push({ channel: "sms", to: phone, code });
        return true;
      },
    },
    email: {
      async sendOtpEmail(message) {
        sent.push({ channel: "email", to: message.toEmail, code: message.code });
        return true;
      },
    },
    config: readAuthConfig({ AUTH_SECRET: SECRET, ...env }),
    newId: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, "0")}`,
    now: () => repository.now,
  };
  return { repository, deps, sent };
}

async function code(promise: Promise<unknown>) {
  try {
    await promise;
    return "OK";
  } catch (error) {
    return error instanceof LoginError ? error.code : `OTHER:${String(error)}`;
  }
}

describe("contact normalization", () => {
  it("normalizes Indian and E.164 phones and rejects junk", () => {
    expect(normalizePhone("91000 60001")).toBe("+919100060001");
    expect(normalizePhone("9100060001")).toBe("+919100060001");
    expect(normalizePhone("+91 91000-60001")).toBe("+919100060001");
    expect(normalizePhone("919100060001")).toBe("+919100060001");
    expect(normalizePhone("12345")).toBeNull();
  });

  it("lowercases emails and rejects invalid ones", () => {
    expect(normalizeEmail("  Learner@Example.TEST ")).toBe("learner@example.test");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });
});

describe("auth config", () => {
  it("requires a long secret", () => {
    expect(() => readAuthConfig({ AUTH_SECRET: "short" })).toThrow();
  });

  it("resolves platform hosts without needing AUTH_SECRET", () => {
    // Tenant resolution must keep working (and failing closed) where sign-in
    // is not configured, e.g. the browser E2E job.
    expect(() => readAuthConfig({})).toThrow();
    expect([...getPlatformHosts({})].sort()).toEqual(["127.0.0.1", "[::1]", "localhost"]);
    expect(
      [...getPlatformHosts({ PLATFORM_HOSTS: " A.example.com ,b.example.com " })].sort(),
    ).toEqual(["a.example.com", "b.example.com"]);
  });

  it("never enables test codes outside APP_ENV=development", () => {
    const production = readAuthConfig({
      AUTH_SECRET: SECRET,
      APP_ENV: "production",
      AUTH_TEST_OTP: "123456",
      AUTH_TEST_PHONES: "+919100060001",
    });
    expect(production.testOtp).toBeNull();
    expect(production.testPhones.size).toBe(0);

    const unset = readAuthConfig({
      AUTH_SECRET: SECRET,
      AUTH_TEST_OTP: "123456",
      AUTH_TEST_PHONES: "+919100060001",
    });
    expect(unset.testOtp).toBeNull();

    const dev = readAuthConfig({
      AUTH_SECRET: SECRET,
      APP_ENV: "development",
      AUTH_TEST_OTP: "123456",
      AUTH_TEST_PHONES: "+919100060001",
    });
    expect(dev.testOtp).toBe("123456");
    expect(dev.testPhones.has("+919100060001")).toBe(true);
  });
});

describe("startLogin", () => {
  it("sends an SMS code and never stores the raw code", async () => {
    const { deps, sent, repository } = setup();
    const result = await startLogin(
      { channel: "PHONE", contact: "9100060001", tenantCollegeId: null },
      deps,
    );

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ channel: "sms", to: "+919100060001" });
    expect(sent[0].code).toMatch(/^[0-9]{6}$/);

    const stored = repository.attempts.get(result.attemptId)!;
    expect(stored.smsCodeMac).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(stored)).not.toContain(sent[0].code);
    expect(result.maskedContact.endsWith("0001")).toBe(true);
    expect(result.emailFallbackAvailable).toBe(true);
  });

  it("starts with email as the only channel", async () => {
    const { deps, sent } = setup();
    const result = await startLogin(
      { channel: "EMAIL", contact: "LEARNER@example.test", tenantCollegeId: null },
      deps,
    );
    expect(sent[0]).toMatchObject({ channel: "email", to: "learner@example.test" });
    expect(result.channel).toBe("EMAIL");
  });

  it("rejects invalid, unknown and disabled accounts", async () => {
    const { deps, repository } = setup();
    expect(
      await code(startLogin({ channel: "PHONE", contact: "abc", tenantCollegeId: null }, deps)),
    ).toBe("INVALID_CONTACT");
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9999999999", tenantCollegeId: null }, deps)),
    ).toBe("NOT_REGISTERED");
    repository.users[0] = { ...learner, platformStatus: "DISABLED" };
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: null }, deps)),
    ).toBe("ACCOUNT_DISABLED");
  });

  it("limits sign-in to the college of a college host", async () => {
    const { deps, repository } = setup();
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: COLLEGE_A }, deps)),
    ).toBe("OK");
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: COLLEGE_B }, deps)),
    ).toBe("NO_ACCOUNT_FOR_DOMAIN");

    repository.memberships["user-1"] = [
      { id: "m-1", collegeId: COLLEGE_B, status: "SUSPENDED" },
    ];
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: COLLEGE_B }, deps)),
    ).toBe("ACCOUNT_SUSPENDED");
  });

  it("lets a recruiter with a grant sign in on that college host", async () => {
    const { deps, repository } = setup();
    repository.memberships["user-1"] = [];
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: COLLEGE_A }, deps)),
    ).toBe("NO_ACCOUNT_FOR_DOMAIN");
    repository.recruiterGrants.add(`user-1:${COLLEGE_A}`);
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: COLLEGE_A }, deps)),
    ).toBe("OK");
  });

  it("allows five sends per contact then throttles", async () => {
    const { deps } = setup();
    for (let i = 0; i < 5; i += 1) {
      expect(
        await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: null }, deps)),
      ).toBe("OK");
    }
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: null }, deps)),
    ).toBe("TOO_MANY_REQUESTS");
  });

  it("reports delivery failure when the provider refuses", async () => {
    const { deps } = setup();
    deps.sms = { async sendOtp() { return false; } };
    expect(
      await code(startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: null }, deps)),
    ).toBe("OTP_DELIVERY_FAILED");
  });

  it("uses the fixed code and sends nothing for listed dev test contacts", async () => {
    const { deps, sent } = setup({
      APP_ENV: "development",
      AUTH_TEST_OTP: "424242",
      AUTH_TEST_PHONES: "+919100060001",
    });
    const result = await startLogin(
      { channel: "PHONE", contact: "9100060001", tenantCollegeId: null },
      deps,
    );
    expect(sent).toHaveLength(0);
    const verified = await verifyLogin(
      { attemptId: result.attemptId, code: "424242", tenantCollegeId: null },
      deps,
    );
    expect(verified.user.id).toBe("user-1");
  });

  it("really sends in production even if a test code is configured", async () => {
    const { deps, sent } = setup({
      APP_ENV: "production",
      AUTH_TEST_OTP: "424242",
      AUTH_TEST_PHONES: "+919100060001",
    });
    const result = await startLogin(
      { channel: "PHONE", contact: "9100060001", tenantCollegeId: null },
      deps,
    );
    expect(sent).toHaveLength(1);
    expect(
      await code(
        verifyLogin({ attemptId: result.attemptId, code: "424242", tenantCollegeId: null }, deps),
      ),
    ).toBe("INCORRECT_OTP");
  });
});

describe("verifyLogin", () => {
  async function started(tenantCollegeId: string | null = null) {
    const ctx = setup();
    const result = await startLogin(
      { channel: "PHONE", contact: "9100060001", tenantCollegeId },
      ctx.deps,
    );
    return { ...ctx, attemptId: result.attemptId, sentCode: ctx.sent[0].code };
  }

  it("accepts the right code once and selects the college host membership", async () => {
    const { deps, attemptId, sentCode } = await started(COLLEGE_A);
    const verified = await verifyLogin(
      { attemptId, code: sentCode, tenantCollegeId: COLLEGE_A },
      deps,
    );
    expect(verified.tenantMembershipId).toBe("m-1");
    expect(verified.isSuperAdmin).toBe(false);

    // Replay after success fails.
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: COLLEGE_A }, deps)),
    ).toBe("INVALID_ATTEMPT");
  });

  it("rejects a wrong code and spends the shared budget", async () => {
    const { deps, attemptId, sentCode, repository } = await started();
    for (let i = 0; i < 5; i += 1) {
      expect(
        await code(verifyLogin({ attemptId, code: "000000", tenantCollegeId: null }, deps)),
      ).toBe("INCORRECT_OTP");
    }
    // Budget exhausted: even the correct code is refused.
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: null }, deps)),
    ).toBe("OTP_ATTEMPTS_EXCEEDED");
    expect(repository.attempts.get(attemptId)!.verificationAttempts).toBe(5);
  });

  it("shares the budget between SMS and the email fallback", async () => {
    const { deps, attemptId, repository } = await started();
    repository.now = new Date(repository.now.getTime() + 31_000);
    await sendEmailFallback({ attemptId, tenantCollegeId: null }, deps);
    for (let i = 0; i < 5; i += 1) {
      await code(verifyLogin({ attemptId, code: "111111", tenantCollegeId: null }, deps));
    }
    expect(repository.attempts.get(attemptId)!.verificationAttempts).toBe(5);
  });

  it("accepts the emailed fallback code", async () => {
    const { deps, attemptId, sent, repository } = await started();
    repository.now = new Date(repository.now.getTime() + 31_000);
    await sendEmailFallback({ attemptId, tenantCollegeId: null }, deps);
    const emailed = sent.find((s) => s.channel === "email")!;
    expect(emailed.to).toBe("learner@example.test");
    const verified = await verifyLogin(
      { attemptId, code: emailed.code, tenantCollegeId: null },
      deps,
    );
    expect(verified.user.id).toBe("user-1");
  });

  it("throttles repeated email fallback requests", async () => {
    const { deps, attemptId } = await started();
    const first = await code(sendEmailFallback({ attemptId, tenantCollegeId: null }, deps));
    // The attempt has no email code yet, so the first send is allowed.
    expect(first).toBe("OK");
    expect(
      await code(sendEmailFallback({ attemptId, tenantCollegeId: null }, deps)),
    ).toBe("TOO_SOON");
  });

  it("refuses a challenge used on a different college host", async () => {
    const { deps, attemptId, sentCode } = await started(COLLEGE_A);
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: COLLEGE_B }, deps)),
    ).toBe("WRONG_TENANT");
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: null }, deps)),
    ).toBe("WRONG_TENANT");
  });

  it("refuses an expired challenge", async () => {
    const { deps, attemptId, sentCode, repository } = await started();
    repository.now = new Date(repository.now.getTime() + 301_000);
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: null }, deps)),
    ).toBe("OTP_EXPIRED");
  });

  it("re-checks authorization when the code is consumed", async () => {
    const { deps, attemptId, sentCode, repository } = await started(COLLEGE_A);
    repository.memberships["user-1"] = [
      { id: "m-1", collegeId: COLLEGE_A, status: "SUSPENDED" },
    ];
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: COLLEGE_A }, deps)),
    ).toBe("ACCOUNT_SUSPENDED");
    // Nothing was consumed, so no session can have been minted from it.
    expect(repository.attempts.get(attemptId)!.usedAt).toBeNull();
  });

  it("rejects an unknown attempt id", async () => {
    const { deps } = setup();
    expect(
      await code(verifyLogin({ attemptId: "nope", code: "123456", tenantCollegeId: null }, deps)),
    ).toBe("INVALID_ATTEMPT");
  });
});

describe("platform administrator second factor", () => {
  async function adminStart(channel: "PHONE" | "EMAIL" = "PHONE") {
    const ctx = setup();
    ctx.repository.superAdmins.add("user-1");
    const result = await startLogin(
      {
        channel,
        contact: channel === "PHONE" ? "9100060001" : "learner@example.test",
        tenantCollegeId: null,
      },
      ctx.deps,
    );
    const sms = ctx.sent.find((m) => m.channel === "sms")!.code;
    const mail = ctx.sent.find((m) => m.channel === "email")!.code;
    return { ...ctx, result, sms, mail };
  }

  it("sends a code to both the phone and the email whichever the entry point", async () => {
    for (const channel of ["PHONE", "EMAIL"] as const) {
      const { result, sent } = await adminStart(channel);
      expect(result.requiresSecondFactor).toBe(true);
      expect(sent.map((m) => m.channel).sort()).toEqual(["email", "sms"]);
    }
  });

  it("does not require a second factor from ordinary users", async () => {
    const ctx = setup();
    const result = await startLogin(
      { channel: "PHONE", contact: "9100060001", tenantCollegeId: null },
      ctx.deps,
    );
    expect(result.requiresSecondFactor).toBe(false);
    expect(ctx.sent).toHaveLength(1);
  });

  it("signs in only when both codes match their own channel", async () => {
    const { deps, result, sms, mail } = await adminStart();
    const base = { attemptId: result.attemptId, tenantCollegeId: null };

    // The phone code alone, the same code twice and swapped codes all fail.
    expect(await code(verifyLogin({ ...base, code: sms }, deps))).toBe(
      "SECOND_FACTOR_REQUIRED",
    );
    expect(
      await code(verifyLogin({ ...base, code: sms, secondCode: sms }, deps)),
    ).toBe("INCORRECT_OTP");
    expect(
      await code(verifyLogin({ ...base, code: mail, secondCode: sms }, deps)),
    ).toBe("INCORRECT_OTP");

    const verified = await verifyLogin(
      { ...base, code: sms, secondCode: mail },
      deps,
    );
    expect(verified.isSuperAdmin).toBe(true);
  });

  it("refuses an administrator without both a phone and an email on file", async () => {
    const ctx = setup();
    ctx.repository.superAdmins.add("user-1");
    ctx.repository.users[0] = { ...learner, email: null };
    expect(
      await code(
        startLogin(
          { channel: "PHONE", contact: "9100060001", tenantCollegeId: null },
          ctx.deps,
        ),
      ),
    ).toBe("SECOND_FACTOR_UNAVAILABLE");
    expect(ctx.sent).toHaveLength(0);
  });
});

describe("send caps per requester", () => {
  const start = (deps: LoginDependencies, ipTag: string | null, contact = "9100060001") =>
    code(
      startLogin(
        { channel: "PHONE", contact, tenantCollegeId: null, ipTag },
        deps,
      ),
    );

  it("an attacker exhausting their own budget does not lock out the real user", async () => {
    const { deps } = setup();
    for (let i = 0; i < 5; i += 1) expect(await start(deps, "attacker")).toBe("OK");
    expect(await start(deps, "attacker")).toBe("TOO_MANY_REQUESTS");
    // The legitimate user, from a different address, still gets a code.
    expect(await start(deps, "victim")).toBe("OK");
  });

  it("many addresses together still cannot exceed the per-contact total", async () => {
    const { deps } = setup();
    for (let i = 0; i < 8; i += 1) expect(await start(deps, `ip-${i}`)).toBe("OK");
    expect(await start(deps, "ip-late")).toBe("TOO_MANY_REQUESTS");
  });

  it("one address cannot pump codes to many different contacts", async () => {
    const { deps, repository } = setup();
    repository.users = Array.from({ length: 21 }, (_, i) => ({
      ...learner,
      id: `u-${i}`,
      phoneE164: `+9191000700${String(i).padStart(2, "0")}`,
      email: `u${i}@example.test`,
    }));
    for (const u of repository.users) {
      repository.memberships[u.id] = [{ id: `m-${u.id}`, collegeId: COLLEGE_A, status: "ACTIVE" }];
    }
    for (let i = 0; i < 20; i += 1) {
      expect(await start(deps, "pumper", `91000700${String(i).padStart(2, "0")}`)).toBe("OK");
    }
    expect(await start(deps, "pumper", "9100070020")).toBe("TOO_MANY_REQUESTS");
  });
});


describe("auth audit fixes", () => {
  async function started(tenantCollegeId: string | null = null) {
    const ctx = setup();
    const result = await startLogin(
      { channel: "PHONE", contact: "9100060001", tenantCollegeId },
      ctx.deps,
    );
    return { ...ctx, attemptId: result.attemptId, sentCode: ctx.sent[0].code };
  }
  const start = (deps: LoginDependencies) =>
    startLogin({ channel: "PHONE", contact: "9100060001", tenantCollegeId: null }, deps);

  it("L1 platform host refuses users holding only suspended or ended memberships", async () => {
    const { deps, repository } = setup();
    repository.memberships["user-1"] = [{ id: "m-1", collegeId: COLLEGE_A, status: "SUSPENDED" }];
    expect(await code(start(deps))).toBe("ACCOUNT_SUSPENDED");
    repository.memberships["user-1"] = [{ id: "m-1", collegeId: COLLEGE_A, status: "ENDED" }];
    expect(await code(start(deps))).toBe("NO_ACCOUNT_FOR_DOMAIN");
    repository.memberships["user-1"] = [];
    expect(await code(start(deps))).toBe("NO_ACCOUNT_FOR_DOMAIN");
    repository.recruiterGrants.add(`user-1:${COLLEGE_B}`);
    expect(await code(start(deps))).toBe("OK");
  });

  it("L1 platform host allows a super admin without memberships", async () => {
    const { deps, repository } = setup();
    repository.memberships["user-1"] = [];
    repository.superAdmins.add("user-1");
    expect(await code(start(deps))).toBe("OK");
  });

  it("L1 is re-checked when the code is consumed on the platform host", async () => {
    const { deps, attemptId, sentCode, repository } = await started();
    repository.memberships["user-1"] = [{ id: "m-1", collegeId: COLLEGE_A, status: "ENDED" }];
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: null }, deps)),
    ).toBe("NO_ACCOUNT_FOR_DOMAIN");
    expect(repository.attempts.get(attemptId)!.usedAt).toBeNull();
  });

  it("L3 a missing second code does not spend the verification budget", async () => {
    const { deps, repository } = setup();
    repository.superAdmins.add("user-1");
    const result = await start(deps);
    expect(
      await code(verifyLogin({ attemptId: result.attemptId, code: "123456", tenantCollegeId: null }, deps)),
    ).toBe("SECOND_FACTOR_REQUIRED");
    expect(repository.attempts.get(result.attemptId)!.verificationAttempts).toBe(0);
  });

  it("L4 reserve failure reports the real reason", async () => {
    const { deps, attemptId, sentCode, repository } = await started();
    repository.attempts.get(attemptId)!.usedAt = repository.now;
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: null }, deps)),
    ).toBe("INVALID_ATTEMPT");

    const second = await started();
    // Attempt expires between load and reserve (race): the DB refuses the reserve.
    const original = second.repository.reserveVerification.bind(second.repository);
    second.repository.reserveVerification = async (id: string) => {
      second.repository.now = new Date(second.repository.now.getTime() + 301_000);
      return original(id);
    };
    expect(
      await code(verifyLogin({ attemptId: second.attemptId, code: second.sentCode, tenantCollegeId: null }, second.deps)),
    ).toBe("OTP_EXPIRED");
  });

  it("L5 issues the session with the consume and revokes the previous cookie", async () => {
    const { deps, attemptId, sentCode, repository } = await started();
    const verified = await verifyLogin(
      {
        attemptId,
        code: sentCode,
        tenantCollegeId: null,
        session: { maxAgeSeconds: 3600, previousToken: "old-token" },
      },
      deps,
    );
    expect(verified.session?.token).toBeTruthy();
    expect(repository.sessions).toHaveLength(1);
    expect(repository.sessions[0].digest).toMatch(/^[0-9a-f]{64}$/);
    expect(repository.sessions[0].previousDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(repository.sessions)).not.toContain(verified.session!.token);
  });

  it("L5 a failing session insert leaves the code unburned", async () => {
    const { deps, attemptId, sentCode, repository } = await started();
    repository.failSessionInsert = true;
    await expect(
      verifyLogin(
        { attemptId, code: sentCode, tenantCollegeId: null, session: { maxAgeSeconds: 3600 } },
        deps,
      ),
    ).rejects.toThrow("insert failed");
    expect(repository.attempts.get(attemptId)!.usedAt).toBeNull();
  });

  it("L6 an unknown address still counts against a coarse per-address bucket", async () => {
    const { deps, repository } = setup();
    await start(deps);
    expect([...repository.attempts.values()][0].ipTag).not.toBeNull();
  });

  it("caps email resends per challenge", async () => {
    const { deps, attemptId, repository } = await started();
    const seen: (number | undefined)[] = [];
    const original = repository.setEmailCode.bind(repository);
    repository.setEmailCode = async (id, mac, gap, max) => {
      seen.push(max);
      return original(id, mac, gap);
    };
    await sendEmailFallback({ attemptId, tenantCollegeId: null }, deps);
    expect(seen).toEqual([5]);
  });

  it("uses the database clock for expiry when the repository supplies one", async () => {
    const { deps, attemptId, sentCode, repository } = await started();
    const original = repository.loadAttempt.bind(repository);
    repository.loadAttempt = async (id: string) => {
      const a = await original(id);
      return a ? { ...a, dbNow: new Date(a.expiresAt.getTime() + 1000) } : a;
    };
    expect(
      await code(verifyLogin({ attemptId, code: sentCode, tenantCollegeId: null }, deps)),
    ).toBe("OTP_EXPIRED");
  });
});
