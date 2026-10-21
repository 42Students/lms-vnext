// Only optional modules may hide navigation. Courses, lessons, quizzes, assignments,
// attendance and class schedule are core LMS capabilities and are never module-toggle targets.
// Navigation filtering does not replace server-side authorization for optional modules.
const MODULE_MATCHERS = {
  projects: {
    paths: ["projects"],
    name: /project/i,
    // Mentors' Meetings route reuses the calendar path used by other modules.
    labelPaths: [{ path: "calendar", label: "Meetings" }],
  },
  placements: {
    paths: ["jobs", "my-placements", "applications", "assessments", "interviews"],
    name: /placement/i,
  },
  electives: {
    paths: ["electives"],
    name: /^electives$/i,
  },
};

function matchesModule(item, module) {
  const matcher = MODULE_MATCHERS[module];
  if (!matcher) return false;
  if (matcher.paths.includes(item?.path)) return true;
  if (matcher.labelPaths?.some((entry) => item?.path === entry.path && item?.modulename === entry.label)) {
    return true;
  }
  if (matcher.name) {
    return matcher.name.test(item?.modulename || "") || matcher.name.test(item?.label || "");
  }
  return false;
}

/**
 * Handles the legacy named flags and the generic modules map. Unknown modules (including
 * retired Courses values returned by an older backend or cached response) cannot hide nav.
 */
export function filterNavByFeatureFlags(items, flags = {}) {
  if (!Array.isArray(items)) return items;
  const { projectsEnabled = true, placementsEnabled = true, modules = {} } = flags;
  const state = {
    projects: modules.projects !== undefined ? modules.projects : projectsEnabled,
    placements: modules.placements !== undefined ? modules.placements : placementsEnabled,
    // Electives has no legacy named flag; absent means enabled, like the backend catalog.
    electives: modules.electives !== undefined ? modules.electives : true,
  };
  const disabled = Object.keys(MODULE_MATCHERS).filter((module) => state[module] === false);
  if (!disabled.length) return items;
  return items.filter((item) => {
    if (item?.divider) return true;
    return !disabled.some((module) => matchesModule(item, module));
  });
}
