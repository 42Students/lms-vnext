/** Catch-all course routes match exactly one known tab, not arbitrary descendants. */
export function learnerCourseTabPath(
  pathSegments: readonly string[],
  allowedTabs: readonly string[],
): string | null {
  if (pathSegments.length !== 1) return null;
  const name = pathSegments[0];
  return name && allowedTabs.includes(name) ? name : null;
}
