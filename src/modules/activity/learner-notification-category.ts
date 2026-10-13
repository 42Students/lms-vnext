/** Legacy learner notification domain tabs, independent of arrival source. */
export const learnerNotificationCategories = [
  { key: "all", label: "All" },
  { key: "course", label: "Course" },
  { key: "project", label: "Projects" },
  { key: "general", label: "Announcements" },
  { key: "job", label: "Job" },
] as const;

export type LearnerNotificationCategory =
  (typeof learnerNotificationCategories)[number]["key"];

export function learnerNotificationCategory(item: {
  module: string;
  source?: "ANNOUNCEMENT";
}): Exclude<LearnerNotificationCategory, "all"> {
  if (item.source === "ANNOUNCEMENT") return "general";
  switch (item.module.toUpperCase()) {
    case "COURSES": return "course";
    case "PROJECTS": return "project";
    case "PLACEMENTS": return "job";
    default: return "general";
  }
}

export function learnerNotificationCategoryCounts(
  items: readonly { module: string; source?: "ANNOUNCEMENT" }[],
) {
  const counts: Record<LearnerNotificationCategory, number> = {
    all: items.length, course: 0, project: 0, general: 0, job: 0,
  };
  for (const item of items) counts[learnerNotificationCategory(item)] += 1;
  return counts;
}
