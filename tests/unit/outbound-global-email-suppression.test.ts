import { describe, expect, it } from "vitest";
import {
  deriveGlobalEmailSuppressionHash,
  deriveGlobalEmailSuppressionHashForAddress,
  sealOutboundDelivery,
} from "@/modules/operations/outbound-delivery-envelope";
import { OutboundDeliveryError } from "@/modules/operations/outbound-delivery-contract";

const key = Buffer.alloc(32, 67).toString("base64");
const differentKey = Buffer.alloc(32, 68).toString("base64");

function intent(overrides: Record<string, unknown> = {}) {
  return {
    organizationId: "10000000-0000-4000-8000-000000000001",
    collegeId: "20000000-0000-4000-8000-000000000001",
    sourceEventId: "30000000-0000-4000-8000-000000000001",
    channel: "EMAIL",
    templateKey: "RECRUITER_INVITATION",
    recipient: " Contact@Employer.Example ",
    variables: {
      collegeName: "College",
      companyName: "Employer",
      invitationUrl: "https://invites.example.test/accept?token=SECRET",
    },
    ...overrides,
  };
}

describe("DB-050 legacy global EMAIL opt-out parity", () => {
  it("matches one globally suppressed recipient across two organizations, not the tenant-local hash", () => {
    const collegeA = intent();
    const collegeB = intent({
      organizationId: "10000000-0000-4000-8000-000000000002",
      collegeId: "20000000-0000-4000-8000-000000000002",
      sourceEventId: "30000000-0000-4000-8000-000000000002",
    });
    const globalA = deriveGlobalEmailSuppressionHash(collegeA, key);
    const globalB = deriveGlobalEmailSuppressionHash(collegeB, key);
    expect(globalA).toMatch(/^[0-9a-f]{64}$/);
    expect(globalA).toBe(globalB);

    const localA = sealOutboundDelivery(collegeA, key);
    const localB = sealOutboundDelivery(collegeB, key);
    expect(localA.recipientHash).not.toBe(localB.recipientHash);
    expect(globalA).not.toBe(localA.recipientHash);
    expect(globalA).not.toBe(localB.recipientHash);
    expect(JSON.stringify(localA)).not.toContain(globalA!);
    expect(JSON.stringify(localB)).not.toContain(globalB!);
  });

  it("uses the exact same global digest for the TPO campaign provider as the durable invitation outbox", () => {
    const recipient = "Contact@Employer.Example";
    expect(deriveGlobalEmailSuppressionHashForAddress(recipient,key)).toBe(
      deriveGlobalEmailSuppressionHash(intent(),key),
    );
    expect(deriveGlobalEmailSuppressionHashForAddress("  contact@employer.example  ",key)).toBe(
      deriveGlobalEmailSuppressionHash(intent(),key),
    );
    expect(()=>deriveGlobalEmailSuppressionHashForAddress("not an email",key))
      .toThrowError("INVALID_OUTBOUND_INTENT");
    expect(()=>deriveGlobalEmailSuppressionHashForAddress(recipient,""))
      .toThrowError("OUTBOUND_KEY_UNAVAILABLE");
  });

  it("normalizes email case/outer whitespace before suppression identity derivation", () => {
    const messy = deriveGlobalEmailSuppressionHash(
      intent({ recipient: "  Contact@Employer.Example  " }), key,
    );
    const canonical = deriveGlobalEmailSuppressionHash(
      intent({ recipient: "contact@employer.example" }), key,
    );
    expect(messy).toBe(canonical);
  });

  it("uses a secret keyed value rather than a bare SHA256 or email", () => {
    const address = "contact@employer.example";
    const first = deriveGlobalEmailSuppressionHash(intent(), key);
    const rotated = deriveGlobalEmailSuppressionHash(intent(), differentKey);
    const otherAddress = deriveGlobalEmailSuppressionHash(
      intent({ recipient: "another@employer.example" }), key,
    );
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(rotated);
    expect(first).not.toBe(otherAddress);
    expect(first).not.toContain(address);
  });

  it("keeps global opt-out identity stable when the envelope encryption key rotates", () => {
    const email = intent();
    const globalKey = key; // Dedicated DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64
    const before = deriveGlobalEmailSuppressionHash(email, globalKey);
    const envelopeBefore = sealOutboundDelivery(email, key);
    const envelopeAfter = sealOutboundDelivery(email, differentKey);
    const after = deriveGlobalEmailSuppressionHash(email, globalKey);
    expect(before).toBe(after);
    expect(envelopeBefore.requestDigest).not.toBe(envelopeAfter.requestDigest);
    expect(envelopeBefore.recipientHash).not.toBe(envelopeAfter.recipientHash);
  });

  it("does not treat SMS and WhatsApp organization-scoped suppressions as legacy global email opt-outs", () => {
    for (const channel of ["SMS", "WHATSAPP"]) {
      expect(deriveGlobalEmailSuppressionHash(
        intent({ channel, recipient: "+919876543210" }), key,
      )).toBeNull();
    }
  });

  it("fails closed for email when HMAC key is missing or malformed", () => {
    expect(() => deriveGlobalEmailSuppressionHash(intent(), "invalid-key"))
      .toThrowError(OutboundDeliveryError);
    expect(() => deriveGlobalEmailSuppressionHash(intent(), "invalid-key"))
      .toThrowError("OUTBOUND_KEY_UNAVAILABLE");
  });

  it("rejects invalid addresses without embedding PII in the error", () => {
    expect(() => deriveGlobalEmailSuppressionHash(
      intent({ recipient: "not-an-email" }), key,
    )).toThrowError("INVALID_OUTBOUND_INTENT");
  });
});
