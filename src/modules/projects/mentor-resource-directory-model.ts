/**
 * Source-only Mentor resource directory helpers. Callers pass already-authorized
 * project rows: these functions must not load resources or weaken role scoping.
 */
export type MentorDirectoryResource = {
  sprintId?: string | null;
  taskId?: string | null;
  pinned?: boolean;
};

/** Completed-sprint resources fold by default, but pinned references remain visible. */
export function mentorResourceEarlierScope<T extends MentorDirectoryResource>(
  rows: readonly T[],
  completedSprintIds: ReadonlySet<string>,
  collapseEarlier: boolean,
): { earlierCount: number; visibleRows: T[] } {
  const isEarlier = (row: T) =>
    !row.pinned && Boolean(row.sprintId && completedSprintIds.has(row.sprintId));
  const earlierCount = rows.filter(isEarlier).length;
  return {
    earlierCount,
    visibleRows: collapseEarlier ? rows.filter(row => !isEarlier(row)) : [...rows],
  };
}

/** A file with an openable URL remains a FILE, not a LINK. */
export function mentorResourceMatchesType(
  filter: string,
  recordedType: string | null | undefined,
  safeOpenableUrl: boolean,
): boolean {
  const kind = recordedType || (safeOpenableUrl ? "LINK" : "NOTE");
  return filter === "ALL" || (filter === "OTHER" ? kind !== "LINK" : filter === kind);
}

/** Use only authorized project sprint/task labels; never synthesize foreign names. */
export function mentorResourceLinkedScopeLabels(
  row: MentorDirectoryResource,
  sprints: readonly { id: string; label: string }[],
  tasks: readonly { id: string; label: string }[],
): string[] {
  const labels: string[] = [];
  if (row.sprintId) {
    const sprint = sprints.find(item => item.id === row.sprintId);
    labels.push(sprint ? "Sprint: " + sprint.label : "Linked sprint unavailable");
  }
  if (row.taskId) {
    const task = tasks.find(item => item.id === row.taskId);
    labels.push(task ? "Task: " + task.label : "Linked task unavailable");
  }
  return labels;
}
