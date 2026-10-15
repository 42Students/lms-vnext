import { describe, expect, it } from "vitest";
import { learnerRoadmapShouldOpenItem } from "@/modules/courses/learner-roadmap-item-focus-model";
describe("Learning Path item modal deep link", () => {
  it("opens only the exact lesson and item focus", () => {
    expect(learnerRoadmapShouldOpenItem("lesson-a","item-1","lesson-a","item-1")).toBe(true);
    expect(learnerRoadmapShouldOpenItem("lesson-a","item-1","lesson-b","item-1")).toBe(false);
    expect(learnerRoadmapShouldOpenItem("lesson-a","item-1","lesson-a","item-2")).toBe(false);
    expect(learnerRoadmapShouldOpenItem("lesson-a","item-1",null,"item-1")).toBe(false);
  });
});
