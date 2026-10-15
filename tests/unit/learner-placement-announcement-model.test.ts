import { describe, expect, it } from "vitest";
import { learnerPlacementNoticeFeed } from "@/modules/placements/learner-placement-announcement-model";

describe("learner placement notice display", () => {
  it("projects only approved presentation fields without identity or scope data", () => {
    const source = [{ id: "1", title: "Notice", message: "Read this", createdAt: new Date("2026-10-15T00:00:00Z"), isPinned: true, privateEmail: "hidden@example.com" }];
    expect(learnerPlacementNoticeFeed(source)).toEqual([{
      id: "1", title: "Notice", message: "Read this", createdAt: "2026-10-15T00:00:00.000Z", isPinned: true,
    }]);
  });
  it("has an honest zero state", () => {
    expect(learnerPlacementNoticeFeed([])).toEqual([]);
  });
});
