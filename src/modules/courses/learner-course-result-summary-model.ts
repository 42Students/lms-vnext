/** Use the actual rendered window, not the semester-wide totals, for result announcements. */
export function learnerCourseResultSummary(visibleCount: number, totalCount: number): string {
  const total = Math.max(0, Math.trunc(totalCount));
  const visible = Math.min(total, Math.max(0, Math.trunc(visibleCount)));
  return `Showing ${visible} of ${total} matching ${total === 1 ? "course" : "courses"}`;
}
