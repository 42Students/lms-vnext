/**
 * Learner Course Home selection, matching the current LMS ordering:
 * the nearest due assessment takes precedence over any live meeting,
 * then the next uncompleted learning item.
 *
 * Activity feeds may remain chronological; action priority is independent
 * of the number of items the feed renders.
 */
export type LearnerOverviewActivity = {
  type: "Assignment" | "Quiz" | "Live Session";
  priority: number;
  overdue?: boolean;
};

export function selectPriorityLearnerActivity<T extends LearnerOverviewActivity>(
  items: readonly T[],
): T | null {
  let selected: T | null = null;
  let selectedRank = Number.POSITIVE_INFINITY;

  for (const item of items) {
    if (!Number.isFinite(item.priority)) continue;
    const rank = item.type === "Assignment" && item.overdue ? -1 : item.type === "Live Session" ? 1 : 0;
    if (
      !selected ||
      rank < selectedRank ||
      (rank === selectedRank && item.priority < selected.priority)
    ) {
      selected = item;
      selectedRank = rank;
    }
  }
  return selected;
}
