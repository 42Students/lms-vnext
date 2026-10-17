import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { friendlyApiError, FRIENDLY_MESSAGES } from "@/lib/friendly-error";

const login = readFileSync("src/components/auth/login-form.tsx", "utf8");

describe("resilient one-time-code sign in", () => {
  it("GR-53 keeps legacy plain OTP errors and guarded transport", () => {
    expect(login).toContain("INCORRECT_OTP:");
    expect(login).toContain("OTP_ATTEMPTS_EXCEEDED:");
    expect(login).toContain('apiFetch<T>(url, {');
    expect(login).toContain("useGuardedAction(");
    expect(login).toContain("Your code is on its way.");
    expect(login).toContain("Get the code by email");
    expect(login).toContain("Resend code in");
    expect(login).not.toContain("const response = await fetch(");
  });
  it("GR-04 safely handles network and invalid upstream content", () => {
    expect(login).toContain("FriendlyFetchError");
    expect(friendlyApiError({ status: 502 })).toBe(FRIENDLY_MESSAGES.unexpected);
  });
  it("GR-30 suppresses repeated submissions while preserving input", () => {
    expect(login).toContain("runGuarded(() => post<");
    expect(login).toContain("disabled={busy}");
  });
  it("GR-15 returns users to the page they left", () => {
    expect(login).toContain('new URLSearchParams(window.location.search).get("returnTo")');
    expect(login).toContain("safeReturnTo");
  });
  it("GR-54 retains retry wait in sign-in affordances", () => {
    expect(login).toContain("RESEND_SECONDS");
    expect(login).toContain("EMAIL_RESEND_SECONDS");
    expect(login).toContain("cooldown > 0");
  });
});
