import { describe, expect, it } from "vitest";
import { learnerProgressAvailability } from "@/modules/courses/learner-progress-availability";

describe("Learner Course progress denominators", () => {
  it("does not call an unpublished learning path 0% complete", () => {
    expect(learnerProgressAvailability({
      hasPublishedLearningPath: false, publishedLessonCount: 0, trackableItemCount: 0,
    })).toMatchObject({ kind: "UNPUBLISHED", hasDenominator: false });
  });
  it("distinguishes a published empty path from lessons without items", () => {
    expect(learnerProgressAvailability({
      hasPublishedLearningPath: true, publishedLessonCount: 0, trackableItemCount: 0,
    })).toMatchObject({ kind: "NO_LESSONS", hasDenominator: false });
    expect(learnerProgressAvailability({
      hasPublishedLearningPath: true, publishedLessonCount: 2, trackableItemCount: 0,
    })).toMatchObject({ kind: "NO_TRACKABLE_ITEMS", hasDenominator: false });
  });
  it("permits real persisted completion percentages when trackable items exist", () => {
    expect(learnerProgressAvailability({
      hasPublishedLearningPath: true, publishedLessonCount: 2, trackableItemCount: 5,
    })).toEqual({ kind: "AVAILABLE", hasDenominator: true, detail: null });
  });
});
