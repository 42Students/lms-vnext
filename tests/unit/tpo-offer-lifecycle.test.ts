import { describe, expect, it } from "vitest";
import {
  canRecordTpoOfferAction,
  tpoOfferLifecycleInputSchema,
  TPO_OFFER_ACTIONS,
} from "@/modules/placements/tpo-offer-lifecycle-model";

const id = (i: number) => "00000000-0000-4000-8000-" + String(i).padStart(12, "0");

describe("TPO evidence-backed offer lifecycle", () => {
  const base = {
    confirmed: true,
    action: "RECORD_ACCEPTED",
    offerIds: [id(1)],
    expectedStatus: "ISSUED",
    reason: "Learner confirmed acceptance in an acknowledged response",
  };
  it("accepts every named action with its required data", () => {
    for (const action of TPO_OFFER_ACTIONS) {
      const payload = {
        ...base,
        action,
        expectedStatus: action === "RECORD_JOINED" ? "ACCEPTED" : "ISSUED",
        ...(action === "EXTEND" ? { expiresAt: "2027-12-24T10:00:00.000Z" } : {}),
        ...(action === "RECORD_JOINED" ? { joiningDate: "2027-12-25" } : {}),
      };
      expect(tpoOfferLifecycleInputSchema.safeParse(payload).success).toBe(true);
    }
  });
  it("rejects missing confirmation, unknown actions, too many or duplicated offers", () => {
    expect(tpoOfferLifecycleInputSchema.safeParse({ ...base, confirmed: false }).success).toBe(false);
    expect(tpoOfferLifecycleInputSchema.safeParse({ ...base, action: "DELETE" }).success).toBe(false);
    expect(tpoOfferLifecycleInputSchema.safeParse({
      ...base, offerIds: Array.from({ length: 201 }, (_, i) => id(i + 1)),
    }).success).toBe(false);
    expect(tpoOfferLifecycleInputSchema.safeParse({ ...base, offerIds: [id(1), id(1)] }).success).toBe(false);
    expect(tpoOfferLifecycleInputSchema.safeParse({ ...base, collegeId: id(2) }).success).toBe(false);
    expect(tpoOfferLifecycleInputSchema.safeParse({ ...base, reason: "short" }).success).toBe(false);
    expect(tpoOfferLifecycleInputSchema.safeParse({
      ...base, action: "RECORD_JOINED", expectedStatus: "ACCEPTED", joiningDate: "2027-02-30",
    }).success).toBe(false);
  });
  it("enforces a pure allowed-transition table and terminal joining guard", () => {
    expect(canRecordTpoOfferAction("EXTEND", "ISSUED", null)).toBe(true);
    expect(canRecordTpoOfferAction("RECORD_ACCEPTED", "ACCEPTED", null)).toBe(false);
    expect(canRecordTpoOfferAction("RECORD_DECLINED", "DECLINED", null)).toBe(false);
    expect(canRecordTpoOfferAction("RECORD_JOINED", "ACCEPTED", "PENDING")).toBe(true);
    expect(canRecordTpoOfferAction("RECORD_JOINED", "ACCEPTED", "JOINED")).toBe(false);
    expect(canRecordTpoOfferAction("WITHDRAW", "ACCEPTED", "JOINED")).toBe(false);
    expect(canRecordTpoOfferAction("WITHDRAW", "ISSUED", null)).toBe(true);
  });
});
