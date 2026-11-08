import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { openOutboundDelivery, outboundKeyRingFromEnv, sealOutboundDelivery, type OutboundKeyRing } from "@/modules/operations/outbound-delivery-envelope";

const b64 = () => randomBytes(32).toString("base64");
const intent = {
  organizationId: "11111111-1111-4111-8111-111111111111", collegeId: "22222222-2222-4222-8222-222222222222",
  sourceEventId: "33333333-3333-4333-8333-333333333333", channel: "EMAIL", templateKey: "RECRUITER_INVITATION",
  recipient: "learner@example.com",
  variables: { companyName: "Employer", collegeName: "College A", invitationUrl: "https://invite.example.test/join?token=T" },
};

describe("SEC-09-011 outbound key ring", () => {
  it("a bare key behaves as before (v1)", () => {
    const k = b64();
    const sealed = sealOutboundDelivery(intent, k);
    expect(sealed.keyId).toBe("v1");
    expect(openOutboundDelivery(sealed, k).recipient).toBe("learner@example.com");
  });
  it("rotation: new rows use v2, old v1 rows still open, digests do not change", () => {
    const oldKey = b64(), newKey = b64();
    const before = sealOutboundDelivery(intent, oldKey);
    const ring = outboundKeyRingFromEnv({
      DB10_OUTBOUND_ENCRYPTION_KEY_BASE64: newKey, DB10_OUTBOUND_ENCRYPTION_KEY_ID: "v2",
      DB10_OUTBOUND_ENCRYPTION_KEY_PREVIOUS_BASE64: oldKey, DB10_OUTBOUND_DIGEST_KEY_BASE64: oldKey,
    } as unknown as NodeJS.ProcessEnv) as OutboundKeyRing;
    const after = sealOutboundDelivery(intent, ring);
    expect(after.keyId).toBe("v2");
    expect(after.recipientHash).toBe(before.recipientHash);
    expect(after.idempotencyKey).toBe(before.idempotencyKey);
    expect(openOutboundDelivery(before, ring).recipient).toBe("learner@example.com");
    expect(openOutboundDelivery(after, ring).recipient).toBe("learner@example.com");
  });
  it("a row sealed with a key that is no longer in the ring does not open", () => {
    const oldKey = b64(), newKey = b64();
    const before = sealOutboundDelivery(intent, oldKey);
    const ring = outboundKeyRingFromEnv({
      DB10_OUTBOUND_ENCRYPTION_KEY_BASE64: newKey, DB10_OUTBOUND_ENCRYPTION_KEY_ID: "v2", DB10_OUTBOUND_DIGEST_KEY_BASE64: oldKey,
    } as unknown as NodeJS.ProcessEnv) as OutboundKeyRing;
    expect(() => openOutboundDelivery(before, ring)).toThrow("OUTBOUND_ENVELOPE_INVALID");
  });
  it("refuses a rotated cipher key without a frozen digest key, and a reused id", () => {
    const k = b64();
    expect(() => outboundKeyRingFromEnv({ DB10_OUTBOUND_ENCRYPTION_KEY_BASE64: k, DB10_OUTBOUND_ENCRYPTION_KEY_ID: "v2" } as unknown as NodeJS.ProcessEnv)).toThrow("OUTBOUND_KEY_UNAVAILABLE");
    expect(() => outboundKeyRingFromEnv({ DB10_OUTBOUND_ENCRYPTION_KEY_BASE64: k, DB10_OUTBOUND_DIGEST_KEY_BASE64: k, DB10_OUTBOUND_ENCRYPTION_KEY_PREVIOUS_BASE64: b64() } as unknown as NodeJS.ProcessEnv)).toThrow("OUTBOUND_KEY_UNAVAILABLE");
  });
});
