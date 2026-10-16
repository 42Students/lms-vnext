import { describe, expect, it } from "vitest";
import {
  publicJoinSendCodeSchema, publicJoinCodeSendAllowed,
  publicJoinCodeDigest, matchesPublicJoinCode,
  PUBLIC_JOIN_PER_EMAIL_HOUR, PUBLIC_JOIN_PER_LINK_HOUR, PUBLIC_JOIN_PER_IP_SEND_HOUR,
} from "@/modules/placements/public-join/code-policy";
import { canContactRecipientAtRuntime } from "@/modules/messaging/runtime-safety";

describe("TPO-campaigns-public-19 bounded public recruiter verification", () => {
  it("never trusts client supplied college/company or personal email", () => {
    const value = { token: "a".repeat(43), email: "person@business.example" };
    expect(publicJoinSendCodeSchema.safeParse(value).success).toBe(true);
    expect(publicJoinSendCodeSchema.safeParse({ ...value, collegeId: "other" }).success).toBe(false);
    expect(publicJoinSendCodeSchema.safeParse({ ...value, email: "person@gmail.com" }).success).toBe(false);
  });
  it("enforces all three server-side send ceilings", () => {
    expect(publicJoinCodeSendAllowed({ emailHour: 0, linkHour: 0, networkHour: 0 })).toBe(true);
    for (const value of [
      { emailHour: PUBLIC_JOIN_PER_EMAIL_HOUR, linkHour: 0, networkHour: 0 },
      { emailHour: 0, linkHour: PUBLIC_JOIN_PER_LINK_HOUR, networkHour: 0 },
      { emailHour: 0, linkHour: 0, networkHour: PUBLIC_JOIN_PER_IP_SEND_HOUR },
      { emailHour: -1, linkHour: 0, networkHour: 0 },
    ]) expect(publicJoinCodeSendAllowed(value)).toBe(false);
  });
  it("stores only purpose-separated HMAC digests and compares codes safely", () => {
    const linkId = "ea9c1d0f-985c-4c68-9abd-bc560075e8ce";
    const email = "person@business.example";
    const key = "testing-secret-exclusively-for-a-test-123456";
    const digest = publicJoinCodeDigest(linkId, email, "003210", key);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(matchesPublicJoinCode(digest, linkId, email, "003210", key)).toBe(true);
    expect(matchesPublicJoinCode(digest, linkId, email, "003211", key)).toBe(false);
  });
  it("does not send a non-allowlisted email in non-production", () => {
    expect(canContactRecipientAtRuntime("EMAIL", "person@business.example", {
      APP_ENV: "development", AUTH_TEST_EMAILS: "allowlisted@example.com",
    })).toBe(false);
  });
});
