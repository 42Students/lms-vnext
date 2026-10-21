// Single source of truth for the college-admin panel's grouped navigation taxonomy — collapses
// the sidebar from ~28 flat entries down to a handful of groups, each reachable via one sidebar
// row and a horizontal PageShell tab strip between its member pages. Consumed by AdminGroupShell
// (renders the tabs), lists.js (builds the collapsed sidebar), and navigationActiveKey.js (keeps
// the right sidebar row highlighted on every member page).
//
// The shared groups' taxonomy is defined once in navGroupDefinitions.js and reused by the
// superadmin panel (superAdminNavGroups.js) — both render the same
// src/pages/superadmin/sections/*.js components under a different basePath and scope.
// Projects is the exception: each panel owns its own taxonomy (ADMIN_PROJECTS_GROUP below),
// because the two roles have genuinely different jobs in that module.
//
// `query` on an item means the tab shares a real page/route with its siblings, distinguished
// only by a query param — used for Lesson Content's Video/Resources/Live Classes split.
import { SHARED_GROUP_DEFINITIONS, buildPathToGroup, buildGroupDefaultPath } from "./navGroupDefinitions";

/**
 * Projects is defined here rather than shared with superadmin, deliberately — see the matching
 * note in superAdminNavGroups.js. College-admin's day is running this college's live projects, so
 * Workspaces is the first tab and the whole landing point; Templates is a catalogue they consult
 * before creating a workspace, not something they author, so it sits late in the strip and has no
 * authoring routes behind it at all.
 *
 * Only things you *monitor* are tabs. Things you *do* — creating a workspace, bulk-reassigning a
 * mentor, opening the deleted bin — are buttons on the list they belong to, each with its own
 * page.
 */
export const ADMIN_PROJECTS_GROUP = {
  title: "Projects",
  items: [
    { path: "projects/workspaces", label: "Workspaces" },
    { path: "projects/at-risk", label: "At Risk" },
    { path: "projects/readiness", label: "Readiness" },
    { path: "projects/submissions", label: "Submissions" },
    { path: "projects/templates", label: "Templates" },
    { path: "projects/audit", label: "Audit" },
  ],
};

/**
 * The tab strip shown *inside* one workspace, replacing the list-level strip so only one set of
 * tabs is ever on screen. Each section owns one concern and both shows and edits it.
 *
 * Same nine sections superadmin sees: running a workspace is the same job whoever does it. They
 * are listed separately from superadmin's copy so the two can diverge later without one panel
 * silently changing the other.
 *
 * Archive and delete are buttons on Summary, not tabs.
 */
export const ADMIN_WORKSPACE_SECTIONS = [
  { path: "summary", label: "Summary" },
  // The project's narrative content (goal, deliverables, definition of done, personas).
  // It lived on Summary only because no tab covered it, which left that page carrying
  // metadata and content at once and made its required-deliverables validator block an
  // unrelated title edit on any workspace that had none.
  { path: "overview", label: "Overview" },
  { path: "team", label: "Team" },
  { path: "sprints", label: "Sprints" },
  { path: "tasks", label: "Tasks" },
  { path: "resources", label: "Resources" },
  { path: "meetings", label: "Meetings" },
  { path: "readiness", label: "Readiness" },
  { path: "delivery", label: "Delivery" },
  { path: "audit", label: "Audit" },
];

export const ADMIN_NAV_GROUPS = {
  academic: { key: "academic", ...SHARED_GROUP_DEFINITIONS.academic },
  content: { key: "content", ...SHARED_GROUP_DEFINITIONS.content },
  // Student Groups is college-admin only for now (no superadmin page yet), so it is appended here
  // rather than in the shared definition the superadmin tab strip also renders.
  people: {
    key: "people",
    ...SHARED_GROUP_DEFINITIONS.people,
    // Student Groups hidden until a feature uses generic groups (see pages/college-admin/student-groups.js).
    items: [...SHARED_GROUP_DEFINITIONS.people.items],
  },
  // Placements and Projects both used to have their own college-admin sidebar entries backed by a
  // dedicated antd-Tabs sub-nav rather than this AdminGroupShell/PageShell system — folded in
  // here so every grouped page shares one tab-strip visual language. (Those sub-nav components
  // are long gone; don't go looking for them.)
  placements: { key: "placements", ...SHARED_GROUP_DEFINITIONS.placements },
  projects: { key: "projects", ...ADMIN_PROJECTS_GROUP },
};

// path segment (the part right after /college-admin/) -> groupKey. First group wins if a path were ever
// listed in two groups (not expected — kept simple rather than throwing on a config mistake).
export const ADMIN_PATH_TO_GROUP = buildPathToGroup(ADMIN_NAV_GROUPS);

// The sidebar row for a group routes to its first member's page.
export const groupDefaultPath = buildGroupDefaultPath(ADMIN_NAV_GROUPS);
