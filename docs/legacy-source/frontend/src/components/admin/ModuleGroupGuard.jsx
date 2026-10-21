import { Result, Skeleton } from "antd";
import { useSelector } from "react-redux";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";

/**
 * Renders an explanation instead of a grouped admin page whose module is switched off.
 *
 * The sidebar already hides these groups (featureFlagNavFilter), but hiding a nav row is not the
 * same as closing the page: a bookmark, a tab left open from before the module was turned off, a
 * link in an email, or the browser's own history all land on the page directly. Until now those
 * routes rendered the full UI and then filled the screen with 403 error toasts as each request
 * came back FEATURE_DISABLED, which reads as the console being broken rather than as a setting
 * someone deliberately changed.
 *
 * Guarding the shell rather than the pages covers every grouped module page at once, and cannot
 * fall out of step the way per-page copies would.
 *
 * Used by AdminGroupShell only, NOT by SuperAdminGroupShell. A superadmin scoped to one college
 * gets that college's real flags from /features/mine, so gating their console would hide the
 * Placements/Projects pages from the one person whose job is to go turn those modules back on —
 * the same self-lockout SuperAdminSidebar already documents and avoids.
 *
 * Only `placements` and `projects` are gated here. `content` (Courses) is deliberately NOT: that
 * module is nav-hide-only, enforced nowhere on the server, and blocking its pages here would
 * quietly turn a documented product decision into something else.
 */
const GUARDED_GROUPS = {
  placements: {
    module: "placements",
    title: "Placements is turned off for this college",
    subTitle:
      "The Placements module has been switched off, so drives, companies, interviews and hiring analytics are unavailable here.",
  },
  projects: {
    module: "projects",
    title: "Projects is turned off for this college",
    subTitle:
      "The Projects module has been switched off, so workspaces, templates, submissions and mentor assignment are unavailable here.",
  },
};

/**
 * College admin audit CA-H06: only a super admin can switch modules (Module Access is a super-admin screen), so a
 * college admin is told who can, instead of being sent to a page they do not have.
 */
export function moduleOffRecoveryHint(loginUser) {
  const isSuperAdmin = loginUser?.id === 0 && loginUser?.userType === "FACULTY";
  return isSuperAdmin
    ? "Turn it back on from Module Access if this looks wrong."
    : "Modules are managed by your 42Students super admin. Ask them to turn it on if your college needs it.";
}

export default function ModuleGroupGuard({ groupKey, children }) {
  const config = GUARDED_GROUPS[groupKey];
  const loginUser = useSelector((state) => state.loginUser);
  const { projectsEnabled, placementsEnabled, modules, loading, failed } = useCollegeFeatureFlags();

  if (!config) return children;
  // Only say "turned off" when the server actually said so. While the flags are loading, and when
  // the lookup failed (network blip, backend restart), the old code read the all-off fallback as a
  // real setting and told the admin the module was switched off. On failure the page renders; the
  // server still refuses a disabled module with FEATURE_DISABLED.
  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;
  if (failed) return children;

  // Same precedence and same fail-open default as featureFlagNavFilter and MentorProjectsPage:
  // the explicit per-module map wins, and anything still unknown (flags loading, flag service
  // hiccup) counts as enabled, so a transient failure never hides a working console behind this.
  const fallback = config.module === "projects" ? projectsEnabled : placementsEnabled;
  const enabled = modules?.[config.module] !== undefined ? modules[config.module] : fallback;

  if (enabled === false) {
    return <Result status="info" title={config.title} subTitle={`${config.subTitle} ${moduleOffRecoveryHint(loginUser)}`} />;
  }
  return children;
}
