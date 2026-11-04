import { describe, expect, it } from "vitest";
import { redactAlertText } from "@/modules/log-alerts/redaction";

describe("provider and diagnostic credential redaction", () => {
  it.each([
    ["GOOGLE_CLIENT_SECRET=abc123", "abc123"],
    ["ZEPTOMAIL_API_KEY=key123", "key123"],
    ["POSTGRES_PASSWORD=shortpass", "shortpass"],
    ["SMTP_PASSWD=shortsmtp", "shortsmtp"],
    ["CLOUD_PRIVATE_KEY=shortkey", "shortkey"],
    ["GOOGLE_OAUTH_REFRESH_TOKEN=refresh17", "refresh17"],
    ["MY_CLIENT_SECRET: secret11", "secret11"],
    ["x-provider-api-key: key1234", "key1234"],
    ["clientSecret=client12", "client12"],
    ["session_id=shortsession", "shortsession"],
    ["AUTHORIZATION: Basic c2hvcnQ=", "c2hvcnQ="],
    ['DATABASE_PASSWORD="short with spaces"', "short with spaces"],
    ["API_KEY='short quoted value'", "short quoted value"],
  ])("never emits a short sensitive value in %s", (input, secret) => {
    const safe = redactAlertText("Provider request failed: " + input);
    expect(safe).not.toContain(secret);
    expect(safe).toContain("redacted");
  });

  it("handles more than one credential in the same diagnostic message", () => {
    const safe = redactAlertText(
      "auth GOOGLE_CLIENT_SECRET=short1 SMTP_PASSWORD=short2 ZEPTOMAIL_API_KEY=short3",
    );
    for (const secret of ["short1", "short2", "short3"]) {
      expect(safe).not.toContain(secret);
    }
  });

  it("keeps nonsecret diagnostic fields useful", () => {
    expect(redactAlertText("Status statusCode=401 retry_count=2")).toBe(
      "Status statusCode=401 retry_count=2",
    );
  });

  it("never re-exposes a value on a second redaction pass", () => {
    const once = redactAlertText("Error POSTGRES_PASSWORD='shortpass'");
    expect(redactAlertText(once)).not.toContain("shortpass");
  });
});
