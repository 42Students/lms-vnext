import { describe, expect, it } from "vitest";
import { LoginError } from "@/modules/auth/login-service";
import { decoyStartResult, isMaskedStartError, padToFloor, uniformStartEnabled } from "@/modules/auth/uniform-start";

describe("SEC-01-003 uniform sign-in start", () => {
  it("is off unless AUTH_UNIFORM_UNKNOWN_CONTACT=1", () => {
    expect(uniformStartEnabled({} as NodeJS.ProcessEnv)).toBe(false);
    expect(uniformStartEnabled({ AUTH_UNIFORM_UNKNOWN_CONTACT: "0" } as unknown as NodeJS.ProcessEnv)).toBe(false);
    expect(uniformStartEnabled({ AUTH_UNIFORM_UNKNOWN_CONTACT: "1" } as unknown as NodeJS.ProcessEnv)).toBe(true);
  });
  it("masks only account-existence errors", () => {
    for (const code of ["NOT_REGISTERED", "NO_ACCOUNT_FOR_DOMAIN", "ACCOUNT_DISABLED", "ACCOUNT_SUSPENDED"] as const)
      expect(isMaskedStartError(new LoginError(code))).toBe(true);
    for (const code of ["INVALID_CONTACT", "TOO_MANY_REQUESTS", "OTP_DELIVERY_FAILED"] as const)
      expect(isMaskedStartError(new LoginError(code))).toBe(false);
    expect(isMaskedStartError(new Error("x"))).toBe(false);
  });
  it("decoy has the real shape, a fresh unstored id and no second factor hint", () => {
    const a = decoyStartResult("EMAIL", "Nobody@Example.com");
    const b = decoyStartResult("EMAIL", "Nobody@Example.com");
    expect(a.attemptId).not.toBe(b.attemptId);
    expect(a.mode).toBe("EMAIL_OTP_SENT");
    expect(a.requiresSecondFactor).toBe(false);
    expect(a.maskedContact).toMatch(/\*/);
    expect(decoyStartResult("PHONE", "+919100061100").mode).toBe("PHONE_OTP_SENT");
  });
  it("pads fast responses to the floor", async () => {
    const t0 = Date.now();
    await padToFloor(t0);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(330);
  });
});
