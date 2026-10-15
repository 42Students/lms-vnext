import { describe, expect, it } from "vitest";
import { assertUndoablePlacementCascadeSnapshot } from "@/modules/placements/placement-cascade-undo-policy";
const baseline = {
  acceptedStatus: "ACCEPTED", acceptedHistoryReason: "cascade:token",
  cascadeId: "token", joiningStatus: "PENDING", joiningHasHistory: false,
  siblingOfferStatuses: ["DECLINED"], siblingApplicationStatuses: ["WITHDRAWN"],
};
describe("P-S1-06 cascade undo guard", () => {
  it("permits only the original untouched cascade", () => {
    expect(() => assertUndoablePlacementCascadeSnapshot(baseline)).not.toThrow();
  });
  it("refuses stale offers, later joining actions, and an unrelated cascade", () => {
    for (const value of [
      { acceptedStatus: "WITHDRAWN" }, { acceptedHistoryReason: "cascade:other" },
      { joiningStatus: "JOINED" }, { joiningHasHistory: true },
      { siblingOfferStatuses: ["ISSUED"] },
      { siblingApplicationStatuses: ["SUBMITTED"] },
    ]) {
      expect(() => assertUndoablePlacementCascadeSnapshot({ ...baseline, ...value }))
        .toThrow("PLACEMENT_OFFER_INVALID_TRANSITION");
    }
  });
});
