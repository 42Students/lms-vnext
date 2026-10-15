import { describe, expect, it } from "vitest";
import { campaignUnsubscribeDecision, publicUnsubscribeConfirmationSchema } from "@/modules/placements/public-campaign-unsubscribe-model";

describe("public campaign unsubscribe confirmation", () => {
  it("never suppresses a contact on GET/open alone", () => {
    expect(campaignUnsubscribeDecision({ tokenValid: true, confirmed: false, alreadySuppressed: false })).toBe("CONFIRM_REQUIRED");
  });
  it("only permits confirmed valid suppression and preserves idempotence", () => {
    expect(campaignUnsubscribeDecision({ tokenValid: true, confirmed: true, alreadySuppressed: false })).toBe("SUPPRESS");
    expect(campaignUnsubscribeDecision({ tokenValid: true, confirmed: true, alreadySuppressed: true })).toBe("ALREADY_SUPPRESSED");
    expect(campaignUnsubscribeDecision({ tokenValid: false, confirmed: true, alreadySuppressed: false })).toBe("INVALID_OR_EXPIRED");
  });
  it("rejects missing confirmation, implicit truthy values and forged fields", () => {
    const token = "x".repeat(40);
    for (const body of [
      { token }, { token, confirm: "true" },
      { token, confirm: true, companyId: "forged" },
    ]) expect(publicUnsubscribeConfirmationSchema.safeParse(body).success).toBe(false);
    expect(publicUnsubscribeConfirmationSchema.safeParse({ token, confirm: true }).success).toBe(true);
  });
});
