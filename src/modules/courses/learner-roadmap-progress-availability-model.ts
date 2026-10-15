/** Never label a published but non-trackable Learning Path as 0% completed. */
export function learnerRoadmapMeasuredProgress(summary: {
  itemsTotal: number;
  overallPercent: number;
}): number | null {
  if (summary.itemsTotal <= 0 || !Number.isFinite(summary.overallPercent)) return null;
  return Math.max(0, Math.min(100, summary.overallPercent));
}
