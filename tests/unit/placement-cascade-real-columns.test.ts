import { describe, expect, it } from "vitest";
import { placementOfferStatusHistory, placementApplicationStatusHistory } from "@/db/schema";

describe("P-S1-06 migrated cascade history columns", () => {
  it("maps accepted, sibling offer, and withdrawn application histories to cascade_id", () => {
    expect(placementOfferStatusHistory.cascadeId.name).toBe("cascade_id");
    expect(placementApplicationStatusHistory.cascadeId.name).toBe("cascade_id");
  });
});
