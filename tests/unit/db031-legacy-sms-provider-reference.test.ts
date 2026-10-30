import { describe, expect, it } from "vitest";
import { legacySmsAttemptDisposition } from "@/db/schema/messaging-receipts";

const base = {
  sourceStatus: "SENT" as const,
  recipientLastDigits: " 3210 ",
  sourceCollegeId: null,
  resolvedCollegeId: null,
};

describe("DB031 legacy provider trace identity", () => {
  it("retains a representable opaque provider identifier exactly", () => {
    const providerId = "SM-" + "A".repeat(61);
    const result = legacySmsAttemptDisposition({ ...base, providerId });
    expect(result).toMatchObject({
      outcome: "PROVIDER_ACCEPTED",
      providerMessageId: providerId,
      recipientSuffix: "3210",
      deliveryConfirmed: false,
    });
  });

  it("refuses 65-128-character provider IDs until the registered column is widened", () => {
    for (const length of [65, 96, 128]) {
      const providerId = "S".repeat(length);
      expect(() => legacySmsAttemptDisposition({ ...base, providerId }))
        .toThrow("Legacy SMS provider reference requires verified schema support");
    }
  });

  it("never truncates or silently sanitizes forbidden provider identifiers", () => {
    for (const providerId of ["SM secret", "SM\nSECRET", "SM/+919876543210", "S".repeat(129)]) {
      expect(() => legacySmsAttemptDisposition({ ...base, providerId }))
        .toThrow("Legacy SMS provider reference requires verified schema support");
    }
  });

  it("does not manufacture a tenant or equate provider acceptance to handset delivery", () => {
    const result = legacySmsAttemptDisposition({
      ...base, sourceStatus: "PENDING", recipientLastDigits: null, providerId: null,
    });
    expect(result).toMatchObject({
      outcome: "NOT_CONFIGURED",
      providerMessageId: null,
      recipientSuffix: null,
      resolvedCollegeId: null,
      deliveryConfirmed: false,
    });
    expect(() => legacySmsAttemptDisposition({
      ...base, providerId: "SM-1", sourceCollegeId: "source-college",
    })).toThrow("Historic SMS college requires verified mapping");
  });
});
