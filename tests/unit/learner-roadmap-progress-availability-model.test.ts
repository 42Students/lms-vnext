import { describe, expect, it } from "vitest";
import { learnerRoadmapMeasuredProgress } from "@/modules/courses/learner-roadmap-progress-availability-model";
describe("Learning Path measurement", () => {
  it("does not turn a published path with no trackable items into zero progress", () => {
    expect(learnerRoadmapMeasuredProgress({ itemsTotal: 0, overallPercent: 0 })).toBeNull();
  });
  it("renders real measured zero and clamps impossible percentages", () => {
    expect(learnerRoadmapMeasuredProgress({ itemsTotal: 3, overallPercent: 0 })).toBe(0);
    expect(learnerRoadmapMeasuredProgress({ itemsTotal: 3, overallPercent: 104 })).toBe(100);
    expect(learnerRoadmapMeasuredProgress({ itemsTotal: 3, overallPercent: NaN })).toBeNull();
  });
});
