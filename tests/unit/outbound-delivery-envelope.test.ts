import { describe, expect, it } from "vitest";
import {
  sealOutboundDelivery,
  openOutboundDelivery,
} from "@/modules/operations/outbound-delivery-envelope";
import {
  parseOutboundIntent,
  OutboundDeliveryError,
} from "@/modules/operations/outbound-delivery-contract";

const masterKey = Buffer.alloc(32, 93).toString("base64");
const otherKey = Buffer.alloc(32, 94).toString("base64");
const secretUrl = "https://invite.example.test/accept?token=ONE_TIME_SECRET_42";

function intent(overrides: Record<string, unknown> = {}) {
  return {
    organizationId: "10000000-0000-4000-8000-000000000001",
    collegeId: "20000000-0000-4000-8000-000000000001",
    sourceEventId: "30000000-0000-4000-8000-000000000001",
    channel: "EMAIL",
    templateKey: "RECRUITER_INVITATION",
    recipient: " Hiring@Employer.Example ",
    variables: {
      collegeName: "College A",
      companyName: "Example Employer",
      contactName: "Recruiting Manager",
      invitationUrl: secretUrl,
    },
    ...overrides,
  };
}

describe("W06 encrypted recruiter invitation boundary", () => {
  it("encrypts all merge fields, recipient and token; decrypts only with correct key", () => {
    const sealed = sealOutboundDelivery(intent(), masterKey);
    expect(sealed.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(sealed.idempotencyKey).toMatch(/^[0-9a-f]{64}$/);
    expect(sealed.recipientHash).toMatch(/^[0-9a-f]{64}$/);
    const persisted = JSON.stringify(sealed);
    for (const sensitive of [secretUrl, "ONE_TIME_SECRET_42", "Hiring@Employer",
      "Example Employer", "Recruiting Manager"]) {
      expect(persisted).not.toContain(sensitive);
    }
    const restored = openOutboundDelivery(sealed, masterKey);
    expect(restored.recipient).toBe("hiring@employer.example");
    expect(restored.variables.invitationUrl).toBe(secretUrl);
  });

  it("uses stable opaque recipient/idempotency keys across encryption randomness", () => {
    const first = sealOutboundDelivery(intent(), masterKey);
    const second = sealOutboundDelivery(intent(), masterKey);
    expect(first.id).not.toBe(second.id);
    expect(first.ciphertextBase64).not.toBe(second.ciphertextBase64);
    expect(first.idempotencyKey).toBe(second.idempotencyKey);
    expect(first.recipientHash).toBe(second.recipientHash);
    expect(first.requestDigest).toBe(second.requestDigest);
    const day4 = sealOutboundDelivery(intent({
      templateKey: "RECRUITER_INVITATION_REMINDER",
    }), masterKey);
    expect(day4.idempotencyKey).not.toBe(first.idempotencyKey);
  });

  it("rejects same logical idempotency key with modified secret using requestDigest", () => {
    const original = sealOutboundDelivery(intent(), masterKey);
    const changed = sealOutboundDelivery(intent({
      variables: {
        collegeName: "College A", companyName: "Example Employer",
        invitationUrl: "https://invite.example.test/accept?token=REISSUED",
      },
    }), masterKey);
    expect(changed.idempotencyKey).toBe(original.idempotencyKey);
    expect(changed.requestDigest).not.toBe(original.requestDigest);
  });

  it("fails closed on wrong master key, swapped college and tampered ciphertext", () => {
    const sealed = sealOutboundDelivery(intent(), masterKey);
    const check = (candidate: typeof sealed, key = masterKey) => {
      let thrown: unknown;
      try {
        openOutboundDelivery(candidate, key);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(OutboundDeliveryError);
      expect((thrown as Error).message).toBe("OUTBOUND_ENVELOPE_INVALID");
      expect((thrown as Error).message).not.toContain("ONE_TIME_SECRET");
    };
    check(sealed, otherKey);
    check({
      ...sealed,
      collegeId: "20000000-0000-4000-8000-000000000002",
    });
    check({
      ...sealed,
      ciphertextBase64: sealed.ciphertextBase64.slice(0, -4) + "AAAA",
    });
  });

  it("never leaks secrets via boundary validation errors", () => {
    const bad = intent({ channel: "SMS", recipient: "hiring@example.com" });
    expect(() => parseOutboundIntent(bad)).toThrow("INVALID_OUTBOUND_INTENT");
    expect(() => sealOutboundDelivery(intent(), "not-a-key"))
      .toThrow("OUTBOUND_KEY_UNAVAILABLE");
    expect(() => parseOutboundIntent(intent({
      variables: {
        collegeName: "A", companyName: "B",
        invitationUrl: "http://unsafe.test?token=SENSITIVE",
      },
    }))).toThrow("INVALID_OUTBOUND_INTENT");
    expect(() => parseOutboundIntent(intent({
      variables: {
        collegeName: "A", companyName: "B",
        invitationUrl: secretUrl, rawToken: "LEAK",
      },
    }))).toThrow("INVALID_OUTBOUND_INTENT");
  });

  it("validates channel-specific recipients and schedule ordering", () => {
    const sms = parseOutboundIntent(intent({ channel: "SMS", recipient: "+919876543210" }));
    expect(sms.recipient).toBe("+919876543210");
    const whatsapp = parseOutboundIntent(intent({
      channel: "WHATSAPP", recipient: "+919876543210",
    }));
    expect(whatsapp.channel).toBe("WHATSAPP");
    expect(() => parseOutboundIntent(intent({
      notBefore: "2026-10-15T16:00:00+05:30",
      expiresAt: "2026-10-15T14:00:00+05:30",
    }))).toThrow("INVALID_OUTBOUND_INTENT");
  });
});
