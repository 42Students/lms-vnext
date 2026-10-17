/** Legacy mentor overload is >150% of the college's average assigned workload.
 * Unassigned projects do not count as a mentor. */
export function projectMentorWorkloadAverage(activeCounts: readonly number[]): number {
  if (activeCounts.length === 0) return 0;
  return activeCounts.reduce((total, count) => total + Math.max(0, count), 0) / activeCounts.length;
}
export function isProjectMentorOverloaded(activeCount: number, activeCounts: readonly number[]): boolean {
  const average = projectMentorWorkloadAverage(activeCounts);
  return average > 0 && activeCount > average * 1.5;
}
