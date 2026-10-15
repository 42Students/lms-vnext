import { describe, expect, it } from "vitest";
import { issueUnsubscribeToken, unsubscribeConfirmation, verifyUnsubscribeToken } from "@/modules/messaging/unsubscribe-model";

const key = "a-secret-key-of-at-least-thirty-two-characters";
const claim = { version: 1 as const, recipientKey: "a".repeat(64), expiresAt: 10000 };
describe("campaign unsubscribe", () => {
  it("GET never unsubscribes or writes", () => {
    const token = issueUnsubscribeToken(claim, key);
    expect(unsubscribeConfirmation(token, key, 9999)).toEqual({ canConfirm: true, willUnsubscribeOnView: false });
  });
  it("rejects tampered, expired, and foreign-key tokens", () => {
    const token = issueUnsubscribeToken(claim, key);
    expect(verifyUnsubscribeToken(token, key, 10000)).toBeNull();
    expect(verifyUnsubscribeToken(token, "another-secret-key-of-at-least-32-characters", 9999)).toBeNull();
    expect(verifyUnsubscribeToken(token + "a", key, 9999)).toBeNull();
  });
});
