import { describe, expect, it } from "vitest";
import { openOutboundDelivery, sealOutboundDelivery } from "@/modules/operations/outbound-delivery-envelope";

const key = Buffer.alloc(32, 83).toString("base64");
const input = {
  organizationId: "10000000-0000-4000-8000-000000000001",
  collegeId: "20000000-0000-4000-8000-000000000001",
  sourceEventId: "30000000-0000-4000-8000-000000000001",
  channel: "EMAIL",
  templateKey: "RECRUITER_INVITATION",
  recipient: "contact@example.test",
  variables: {
    collegeName: "College",
    companyName: "Employer",
    invitationUrl: "https://example.test/invite",
  },
  notBefore: "2026-10-29T10:30:00+05:30",
  expiresAt: "2026-10-30T10:30:00+05:30",
};

describe("Outbound scheduled envelope", () => {
  it("accepts equivalent UTC timestamps after PostgreSQL conversion", () => {
    const sealed = sealOutboundDelivery(input, key);
    const restored = openOutboundDelivery({
      ...sealed,
      notBefore: "2026-10-29T05:00:00.000Z",
      expiresAt: "2026-10-30T05:00:00.000Z",
    }, key);
    expect(restored.notBefore).toBe(input.notBefore);
    expect(restored.expiresAt).toBe(input.expiresAt);
  });

  it("rejects changed or removed scheduled timestamps", () => {
    const sealed = sealOutboundDelivery(input, key);
    expect(() => openOutboundDelivery({
      ...sealed, notBefore: "2026-10-29T05:00:01.000Z",
    }, key)).toThrowError("OUTBOUND_ENVELOPE_INVALID");
    expect(() => openOutboundDelivery({
      ...sealed, notBefore: null,
    }, key)).toThrowError("OUTBOUND_ENVELOPE_INVALID");
  });

  it("rejects changed message metadata", () => {
    const sealed = sealOutboundDelivery(input, key);
    expect(() => openOutboundDelivery({
      ...sealed, sourceEventId: "30000000-0000-4000-8000-000000000002",
    }, key)).toThrowError("OUTBOUND_ENVELOPE_INVALID");
  });
});
