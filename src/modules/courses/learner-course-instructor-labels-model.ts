/** Repeated teaching assignments should not duplicate a Course card instructor. */
export function learnerCourseInstructorLabels(
  instructors: readonly { membershipId: string; name: string | null }[],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const instructor of instructors) {
    if (seen.has(instructor.membershipId)) continue;
    seen.add(instructor.membershipId);
    result.push(instructor.name?.trim() || "Instructor");
  }
  return result;
}
