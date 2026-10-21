/**
 * Works out where a workspace's "back" action should return to.
 *
 * A workspace is reachable from four different lists — Workspaces, At Risk, Readiness and
 * Submissions — and At Risk/Submissions link in with a `?reason=` explaining why that row was
 * flagged. A hardcoded "Back to workspaces" therefore dumped you on the unfiltered list, losing
 * whichever filtered view you were actually working through. The origin travels in `?from=` so the
 * action can name and return to the list you came from.
 *
 * Unknown or missing values fall back to the workspaces list, so an old link, a hand-typed URL or
 * a bookmark still gets a sensible destination rather than a dead control.
 *
 * Which lists attach `?from=` today: At Risk, Submissions and the Audit log's Open action.
 * Workspaces relies on the fallback. Readiness and the deleted bin have no link into a workspace
 * at all, so those two entries are destinations waiting for a link rather than ones in use — kept
 * because the cost is two lines and an unknown `from` value falls back safely either way.
 */
const ORIGINS = {
  workspaces: { segment: "workspaces", label: "workspaces" },
  "at-risk": { segment: "at-risk", label: "at-risk" },
  readiness: { segment: "readiness", label: "readiness" },
  submissions: { segment: "submissions", label: "submissions" },
  deleted: { segment: "workspaces/deleted", label: "deleted workspaces" },
  audit: { segment: "audit", label: "the audit log" },
};

export function resolveWorkspaceBackTarget(basePath, from) {
  const key = Array.isArray(from) ? from[0] : from;
  const origin = ORIGINS[key] || ORIGINS.workspaces;
  return {
    href: `${basePath}/projects/${origin.segment}`,
    label: `← Back to ${origin.label}`,
  };
}

