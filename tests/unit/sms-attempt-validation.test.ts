import { describe, expect, it } from "vitest";
import { validatedSmsAttempt } from "@/modules/notifications/sms-attempt-validation";

const accepted = {
  purpose: "otp",
  recipient: "+91 98765 43210",
  outcome: "PROVIDER_ACCEPTED",
  providerSid: "exotel:abc_123",
};

describe("DB-031 SMS attempt audit boundary", () => {
  it("accepts a legitimate provider receipt but stores only a four-digit suffix", () => {
    expect(validatedSmsAttempt(accepted)).toEqual({
      purpose: "otp", suffix: "3210", outcome: "PROVIDER_ACCEPTED",
      providerSid: "exotel:abc_123", failureCode: null,
      sourceEventId: null, collegeId: null, organizationId: null,
    });
  });

  it("allows a safe failed pre-login OTP attempt without a known phone", () => {
    expect(validatedSmsAttempt({
      purpose: "otp", recipient: "", outcome: "FAILED",
      failureCode: "RECIPIENT_INVALID",
    })).toMatchObject({
      purpose: "otp", suffix: null, outcome: "FAILED",
      failureCode: "RECIPIENT_INVALID",
    });
  });

  it("refuses runtime-forged purpose, receipt state and arbitrary text", () => {
    for (const candidate of [
      { ...accepted, purpose: "otp:raw-phone+919876543210" },
      { ...accepted, outcome: "DELIVERED" },
      { ...accepted, providerSid: "provider token=secret" },
      { ...accepted, failureCode: "SHOULD_NOT_BE_PRESENT" },
      { ...accepted, providerSid: null },
      { ...accepted, recipient: "PRIVATE OTP 43210" },
    ]) expect(validatedSmsAttempt(candidate)).toBeNull();
  });

  it("rejects unscoped/forged tenant pairs and invalid event identifiers", () => {
    const id = "10000000-0000-4000-8000-000000000001";
    expect(validatedSmsAttempt({
      ...accepted, organizationId: id, collegeId: null,
    })).toBeNull();
    expect(validatedSmsAttempt({
      ...accepted, sourceEventId: "not-a-uuid",
    })).toBeNull();
    expect(validatedSmsAttempt({
      ...accepted, sourceEventId: id, organizationId: id, collegeId: id,
    })).toMatchObject({
      sourceEventId: id, organizationId: id, collegeId: id,
    });
  });

  it("rejects raw failure strings and sid-bearing FAILED results", () => {
    for (const invalid of [
      { purpose: "notification", recipient: "9876543210",
        outcome: "FAILED", failureCode: "HTTP failed: +919876543210" },
      { purpose: "notification", recipient: "9876543210",
        outcome: "FAILED", failureCode: "PROVIDER_UNAVAILABLE",
        providerSid: "accepted-by-operator" },
      { purpose: "notification", recipient: "9876543210",
        outcome: "FAILED", failureCode: null },
    ]) expect(validatedSmsAttempt(invalid)).toBeNull();
  });
});
