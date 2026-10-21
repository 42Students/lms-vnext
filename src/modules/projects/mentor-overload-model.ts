/** Legacy mentor overload requires 1.5× mean AND a margin of 3 assignments.
 * Unassigned projects do not count as a mentor. */
export function projectMentorWorkloadAverage(activeCounts: readonly number[]): number {
  if (activeCounts.length === 0) return 0;
  return activeCounts.reduce((total, count) => total + Math.max(0, count), 0) / activeCounts.length;
}
export function isProjectMentorOverloaded(activeCount: number, activeCounts: readonly number[]): boolean {
  const average = projectMentorWorkloadAverage(activeCounts);
  const threshold=Math.floor(Math.max(average*1.5,average+3));
  return average > 0 && activeCount >= threshold;
}
