/**
 * Works out which tab in a group's strip should read as active for the current route.
 *
 * Exact path equality is not enough, and that was a real defect: `/superadmin/projects/workspaces`
 * lit the Workspaces pill, but `/superadmin/projects/workspaces/new`, `/deleted` and
 * `/reassign-mentor` matched nothing, so those pages rendered all six tabs with none highlighted
 * — the strip silently claiming you were nowhere. Same for `/templates/new` and, on the
 * college-admin side, `/templates/[templateId]`, which is that panel's only template page.
 *
 * A tab therefore also owns everything nested beneath it. `startsWith` alone would be too greedy
 * ("projects/at-risk" is not a parent of "projects/at-risk-summary"), so the match requires either
 * an exact hit or a `/` boundary immediately after the tab's own path.
 *
 * When several tabs match — a group with both "a" and "a/b" — the longest wins, so the most
 * specific tab is the one that lights up rather than whichever happened to be declared first.
 *
 * Items carrying a `query` (a tab distinguished from its siblings only by a query param, as
 * Lesson Content's Video/Resources/Live Classes split does) still have to match that query
 * exactly; nesting does not apply to them, since the route is identical for every such sibling.
 * Such an item with no matching query param lights nothing, which is correct — the strip cannot
 * know which of the identical-route siblings was meant.
 *
 * Returns the matched ITEM, not its path. That distinction is load-bearing: three Lesson Content
 * tabs share the path "lesson-content" and differ only by `query.type`, so a caller comparing on
 * path alone lights all three at once and emits `aria-current="page"` three times in one nav.
 * Compare the returned item by identity.
 */
export function resolveActiveTabItem(items, basePath, pathname, query) {
  if (!Array.isArray(items) || !pathname) return null;

  let best = null;
  for (const item of items) {
    const itemPath = `${basePath}/${item.path}`;

    if (item.query) {
      if (pathname !== itemPath) continue;
      const queryMatches = Object.entries(item.query).every(
        ([key, value]) => String(query?.[key] ?? "") === String(value)
      );
      if (!queryMatches) continue;
      // An exact route+query match is as specific as it gets — take it immediately.
      return item;
    }

    const isSelf = pathname === itemPath;
    const isNested = pathname.startsWith(`${itemPath}/`);
    if (!isSelf && !isNested) continue;

    if (!best || item.path.length > best.path.length) best = item;
  }

  return best;
}
