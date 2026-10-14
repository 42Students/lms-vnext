export type LearnerProgressAvailability = {
  kind: "UNPUBLISHED" | "NO_LESSONS" | "NO_TRACKABLE_ITEMS" | "AVAILABLE";
  hasDenominator: boolean;
  detail: string | null;
};

/** Never present a zero denominator as a measured 0% or 100% completion. */
export function learnerProgressAvailability(input: {
  hasPublishedLearningPath: boolean;
  publishedLessonCount: number;
  trackableItemCount: number;
}): LearnerProgressAvailability {
  if (!input.hasPublishedLearningPath) {
    return {
      kind: "UNPUBLISHED",
      hasDenominator: false,
      detail: "A learning path has not been published for this course. Completion cannot be calculated yet.",
    };
  }
  if (input.publishedLessonCount === 0) {
    return {
      kind: "NO_LESSONS",
      hasDenominator: false,
      detail: "This learning path contains no published lessons yet. A 0% completion value would be misleading.",
    };
  }
  if (input.trackableItemCount === 0) {
    return {
      kind: "NO_TRACKABLE_ITEMS",
      hasDenominator: false,
      detail: "Published lessons have no trackable learning items yet. Completion cannot be calculated.",
    };
  }
  return { kind: "AVAILABLE", hasDenominator: true, detail: null };
}
