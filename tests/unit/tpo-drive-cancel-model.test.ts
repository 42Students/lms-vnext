import { describe, expect, it } from "vitest";
import {
  evaluateTpoDriveCancellation,
  tpoDriveCancelSchema,
} from "@/modules/placements/tpo-drive-cancel-model";

const impact = { submittedApplications: 4, openRounds: 2, issuedOffers: 1, acceptedOffers: 0 };

describe("TPO drive cancellation", () => {
  it("allows only published active-season drives against an unchanged impact", () => {
    expect(evaluateTpoDriveCancellation("PUBLISHED", "ACTIVE", impact, impact)).toBe("ALLOW");
    expect(evaluateTpoDriveCancellation("DRAFT", "ACTIVE", impact, impact)).toBe("READ_ONLY");
    expect(evaluateTpoDriveCancellation("CLOSED", "ACTIVE", impact, impact)).toBe("READ_ONLY");
    expect(evaluateTpoDriveCancellation("PUBLISHED", "CLOSED", impact, impact)).toBe("READ_ONLY");
    expect(evaluateTpoDriveCancellation("PUBLISHED", "ACTIVE", impact, { ...impact, openRounds: 1 })).toBe("PREVIEW_STALE");
  });

  it("blocks cancellation when a learner has accepted an offer", () => {
    const accepted = { ...impact, acceptedOffers: 1 };
    expect(evaluateTpoDriveCancellation("PUBLISHED", "ACTIVE", accepted, accepted)).toBe("BLOCKED_ACCEPTED_OFFERS");
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
