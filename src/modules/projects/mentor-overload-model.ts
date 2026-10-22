/** Legacy mentor overload: active count >= max(1.5× mean, mean + 3).
 * Unassigned projects do not count as a mentor. */
export function projectMentorWorkloadAverage(activeCounts: readonly number[]): number {
  if (activeCounts.length === 0) return 0;
  return activeCounts.reduce((total, count) => total + Math.max(0, count), 0) / activeCounts.length;
}
export function isProjectMentorOverloaded(activeCount: number, activeCounts: readonly number[]): boolean {
  // Compare scaled workloads to avoid floating-point rounding at exactly 150%.
  // Legacy flags a mentor at or above max(1.5× mean, mean + 3), inclusive.
  const total = activeCounts.reduce((sum, count) => sum + Math.max(0, count), 0);
  const mentorCount = activeCounts.length;
  return total > 0 && mentorCount > 0 &&
    activeCount * mentorCount * 2 >= total * 3 &&
    activeCount * mentorCount >= total + mentorCount * 3;
}
