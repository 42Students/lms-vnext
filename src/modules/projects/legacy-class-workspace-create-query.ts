/** Preserve the authorized template choice when old class-workspace bookmarks
 * are redirected to the consolidated college workspace creator.
 *
 * Do not forward arbitrary query parameters or allow the old link to select a
 * different creation mode. Template IDs are checked against the current
 * college's assigned templates again on the destination page.
 */
export function legacyClassWorkspaceCreateHref(
  query: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams({ mode: "teams" });
  const requested = query.templateId;
  if (typeof requested === "string" && requested.length <= 120 &&
      /^[A-Za-z0-9_-]+$/.test(requested)) {
    params.set("templateId", requested);
  }
  return "/college/projects/create?" + params.toString();
}
