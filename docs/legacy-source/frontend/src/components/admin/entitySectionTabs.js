/**
 * Builds the tab strip shown inside one entity (a workspace or a template).
 *
 * Two things this exists to get right, both of which were wrong when each shell built its own:
 *
 * 1. **Carry the context query.** `?from=` tells the shell which list to return to and `?reason=`
 *    explains why a row was flagged. Plain section hrefs dropped both, so arriving from At Risk
 *    showed "← Back to at-risk" on the first page and silently reverted to the workspaces list on
 *    the very next tab click — the exact loss workspaceBackTarget exists to prevent.
 *
 * 2. **Never emit an href with an empty id.** On the render before `router.isReady` the id is
 *    undefined, and `.../workspaces//summary` is a real, clickable, 404ing URL. A strip with no
 *    entity is meaningless, so it renders as nothing until the id arrives.
 *
 * Active state is matched on `router.pathname` (the route pattern, `[workspaceId]` and all) rather
 * than the resolved URL, so it does not depend on how the id happens to be encoded.
 */
const CARRIED_QUERY_KEYS = ["from", "reason"];

export function buildEntitySectionTabs({ sections, basePath, entityId, pathname, query, routePattern }) {
  if (!entityId) return [];

  const carried = new URLSearchParams();
  for (const key of CARRIED_QUERY_KEYS) {
    const value = query?.[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (single) carried.set(key, single);
  }
  const suffix = carried.toString() ? `?${carried.toString()}` : "";
  const id = encodeURIComponent(entityId);

  return sections.map((section) => ({
    key: section.path,
    label: section.label,
    href: `${basePath}/${id}/${section.path}${suffix}`,
    active: pathname === `${routePattern}/${section.path}`,
  }));
}
