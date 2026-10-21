// Superadmin panel's grouped navigation taxonomy — mirrors adminNavGroups.js (college-admin)
// exactly for the groups both panels share (they render the identical
// src/pages/superadmin/sections/*.js components), plus the platform-wide groups only superadmin
// has (Tenant Setup, Feature Controls — see SUPER_ADMIN_STANDALONE below).
import { SHARED_GROUP_DEFINITIONS, buildPathToGroup, buildGroupDefaultPath } from "./navGroupDefinitions";

/**
 * Projects is defined here rather than shared with college-admin, deliberately.
 *
 * Superadmin's day in this module is authoring the template catalog and deciding which colleges
 * get which template; college-admin's is running their own college's live projects. The two want
 * a different first tab and, over time, different tabs entirely — superadmin owns template
 * authoring, versions and per-college assignment, none of which college-admin can do. Sharing one
 * definition forced both panels to move together and is why the two ended up with the same eight
 * destinations regardless of what either role actually needed.
 *
 * Only things you *monitor* are tabs. Things you *do* — creating, bulk-reassigning, viewing the
 * deleted bin — are buttons on the list they belong to, each leading to its own page, so the
 * strip stays scannable and nothing here competes for attention.
 */
export const SUPER_ADMIN_PROJECTS_GROUP = {
  title: "Projects",
  items: [
    { path: "projects/templates", label: "Templates" },
    { path: "projects/workspaces", label: "Workspaces" },
    { path: "projects/at-risk", label: "At Risk" },
    { path: "projects/readiness", label: "Readiness" },
    { path: "projects/submissions", label: "Submissions" },
    { path: "projects/audit", label: "Audit" },
  ],
};

/**
 * The tab strip shown *inside* one workspace, replacing the list-level strip entirely so there is
 * never more than one set of tabs on screen. Each section owns one concern and both shows and
 * edits it — there is no separate view page and edit form for the same thing, which was the old
 * "which of these two places do I go?" problem.
 *
 * Archive and delete are not tabs: they live as buttons on Summary, so a destructive action is
 * never one stray click away in a nav strip.
 */
export const SUPER_ADMIN_WORKSPACE_SECTIONS = [
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

/** Superadmin-only: college-admin can read a template but never author one. */
export const SUPER_ADMIN_TEMPLATE_SECTIONS = [
  { path: "overview", label: "Overview" },
  { path: "sprints", label: "Sprints" },
  { path: "tasks", label: "Tasks" },
  { path: "resources", label: "Resources" },
  // No Meetings tab: template.meetings is stored and re-displayed, but unlike sprints/tasks/
  // resources it is never read when a workspace is created from the template — loadProjectMeetings
  // has no template-fallback overload, so nothing an admin fills in here would ever reach a
  // project. Editing it was a form that did nothing. Real per-workspace meetings still live on the
  // workspace's own Meetings tab, where they hit meetingRepository and actually take effect.
  { path: "colleges", label: "Colleges" },
  { path: "versions", label: "Versions" },
];

/**
 * Placements, superadmin's own: the four tabs college-admin also has, plus the two only 42 has, Recruiter accounts (a recruiter
 * spans colleges) and Announcements (42 to placement cells). They were lone sidebar rows; all placement work is one place now.
 */
export const SUPER_ADMIN_PLACEMENTS_GROUP = {
  title: SHARED_GROUP_DEFINITIONS.placements.title,
  items: [
    ...SHARED_GROUP_DEFINITIONS.placements.items,
    { path: "recruiters", label: "Recruiter accounts" },
    { path: "announcements", label: "Announcements" },
  ],
};

export const SUPER_ADMIN_NAV_GROUPS = {
  academic: { key: "academic", ...SHARED_GROUP_DEFINITIONS.academic },
  content: { key: "content", ...SHARED_GROUP_DEFINITIONS.content },
  people: { key: "people", ...SHARED_GROUP_DEFINITIONS.people },
  placements: { key: "placements", ...SUPER_ADMIN_PLACEMENTS_GROUP },
  projects: { key: "projects", ...SUPER_ADMIN_PROJECTS_GROUP },
};

export const SUPER_ADMIN_PATH_TO_GROUP = buildPathToGroup(SUPER_ADMIN_NAV_GROUPS);
export const superAdminGroupDefaultPath = buildGroupDefaultPath(SUPER_ADMIN_NAV_GROUPS);

// Standalone sidebar rows — no tab strip, one page each. `global` marks pages that work with no
// college/org selected at all (platform-wide); everything else requires the header scope selector
// to have a college chosen, same convention as every grouped page.
export const SUPER_ADMIN_STANDALONE_PAGES = [
  { path: "dashboard", label: "Overview", global: true },
  { path: "tenants", label: "Tenant Setup", global: true },
  { path: "features", label: "Feature Controls", global: true },
  // Not global: every level below GLOBAL hangs off a college, so this needs one selected.
  { path: "module-access", label: "Module Access" },
  { path: "audit", label: "Activity Log", global: true },
  { path: "inbound-mail", label: "Inbound mail", global: true },
];
