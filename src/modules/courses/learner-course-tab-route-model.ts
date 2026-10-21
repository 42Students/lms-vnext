/** Legacy catch-all routes select the first segment even when additional
 * segments follow. The page canonicalizes extra segments after authorizing
 * the learner delivery, preserving safe query parameters. */
export function learnerCourseTabPath(
  pathSegments: readonly string[],
  allowedTabs: readonly string[],
): string | null {
  const name = pathSegments[0];
  return name && allowedTabs.includes(name) ? name : null;
}
