import { describe, expect, it } from "vitest";
import {
  evaluateTpoDriveCancellation,
  isIssuedOfferCancelable,
  tpoDriveCancelSchema,
} from "@/modules/placements/tpo-drive-cancel-model";

const impact = { submittedApplications: 4, openRounds: 2, issuedOffers: 1, acceptedOffers: 0 };

describe("TPO drive cancellation", () => {
  it("TPO-drives-16 allows only published active-season drives against an unchanged impact", () => {
    expect(evaluateTpoDriveCancellation("PUBLISHED", "ACTIVE", impact, impact)).toBe("ALLOW");
    expect(evaluateTpoDriveCancellation("DRAFT", "ACTIVE", impact, impact)).toBe("READ_ONLY");
    expect(evaluateTpoDriveCancellation("CLOSED", "ACTIVE", impact, impact)).toBe("READ_ONLY");
    expect(evaluateTpoDriveCancellation("PUBLISHED", "CLOSED", impact, impact)).toBe("READ_ONLY");
    expect(evaluateTpoDriveCancellation("PUBLISHED", "ACTIVE", impact, { ...impact, openRounds: 1 })).toBe("PREVIEW_STALE");
  });

  it("keeps accepted offers and permits cancellation", () => {
    const accepted = { ...impact, acceptedOffers: 1 };
    expect(evaluateTpoDriveCancellation("PUBLISHED", "ACTIVE", accepted, accepted)).toBe("ALLOW");
  });

  it("requires confirmation, a real reason and strict shape", () => {
    const valid = {
      action: "CANCEL",
      confirmed: true,
      expectedUpdatedAt: "2026-10-15T10:00:00.123Z",
      expectedImpact: impact,
      reason: "Company withdrew the opening",
    };
    expect(tpoDriveCancelSchema.safeParse(valid).success).toBe(true);
    expect(tpoDriveCancelSchema.safeParse({ ...valid, action: "CLOSE" }).success).toBe(false);
    expect(tpoDriveCancelSchema.safeParse({ ...valid, confirmed: false }).success).toBe(false);
    expect(tpoDriveCancelSchema.safeParse({ ...valid, reason: "short" }).success).toBe(false);
    expect(tpoDriveCancelSchema.safeParse({ ...valid, collegeId: "x" }).success).toBe(false);
  });
});

describe("P-S2-12 cancel outstanding offers", () => {
  it("withdraws ISSUED only; accepted offers are retained", () => {
    expect(isIssuedOfferCancelable("ISSUED")).toBe(true);
    for (const status of ["ACCEPTED","DECLINED","WITHDRAWN","EXPIRED"]) {
      expect(isIssuedOfferCancelable(status)).toBe(false);
    }
    const accepted = { submittedApplications: 2, openRounds: 1, issuedOffers: 1, acceptedOffers: 1 };
    expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE", accepted, accepted)).toBe("ALLOW");
  });
});
