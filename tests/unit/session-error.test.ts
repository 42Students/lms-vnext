import { describe, expect, it } from "vitest";
import { classifySessionVerificationError } from "@/auth/session-error";

describe("session verification error classification", () => {
  it("distinguishes expired Firebase session cookies", () => {
    expect(
      classifySessionVerificationError({
        code: "auth/session-cookie-expired",
      }),
    ).toBe("SESSION_EXPIRED");
  });

  it("distinguishes revoked Firebase session cookies", () => {
    expect(
      classifySessionVerificationError({
        code: "auth/session-cookie-revoked",
      }),
    ).toBe("SESSION_REVOKED");
  });

  it("fails closed to invalid for unknown verification failures", () => {
    expect(
      classifySessionVerificationError({
        code: "auth/invalid-session-cookie",
      }),
    ).toBe("SESSION_INVALID");
    expect(
      classifySessionVerificationError(new Error("boom")),
    ).toBe("SESSION_INVALID");
  });
});
