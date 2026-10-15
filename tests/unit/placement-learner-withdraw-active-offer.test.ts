import { describe, expect, it } from "vitest";
import { canSelfWithdrawPlacementApplication } from "@/modules/placements/application-service";

describe("P-S2-11 learner self-withdrawal gate", () => {
  it("allows no offers and fully resolved offers", () => {
    expect(canSelfWithdrawPlacementApplication([])).toBe(true);
    expect(canSelfWithdrawPlacementApplication([
      { status: "DECLINED" }, { status: "WITHDRAWN" },
    ])).toBe(true);
  });
  it("blocks both issued and accepted offers regardless of other records", () => {
    expect(canSelfWithdrawPlacementApplication([{ status: "ISSUED" }])).toBe(false);
    expect(canSelfWithdrawPlacementApplication([
      { status: "WITHDRAWN" }, { status: "ACCEPTED" },
    ])).toBe(false);
  });
});
