/** A learner deep link may auto-open only the exact published item under the
 * matching authorized lesson; a stale or mismatched focus remains a closed row. */
export function learnerRoadmapShouldOpenItem(
  lessonId: string, itemId: string,
  focusLessonId: string | null, focusContentId: string | null,
): boolean {
  return focusLessonId !== null && focusContentId !== null &&
    focusLessonId === lessonId && focusContentId === itemId;
}
