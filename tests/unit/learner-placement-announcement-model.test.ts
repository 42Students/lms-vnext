import { describe, expect, it } from "vitest";
import { learnerPlacementNoticeFeed } from "@/modules/placements/learner-placement-announcement-model";

describe("learner placement notice display", () => {
  it("projects only approved presentation fields without identity or scope data", () => {
    const source = [{ id: "1", title: "Notice", message: "Read this", createdAt: new Date("2026-10-15T00:00:00Z"), isPinned: true, privateEmail: "hidden@example.com" }];
    const [notice] = learnerPlacementNoticeFeed(source);
    expect(notice).toMatchObject({
      id: "1", title: "Notice", message: "Read this", createdAt: "2026-10-15T00:00:00.000Z",
      isPinned: true, updatedAt: null, publicationDateUnavailable: false, bodyLinks: [],
      authorName: null, unread: null,
    });
    expect(notice).not.toHaveProperty("privateEmail");
    expect(notice).not.toHaveProperty("collegeId");
  });
  it("has an honest zero state", () => {
    expect(learnerPlacementNoticeFeed([])).toEqual([]);
  });
});
