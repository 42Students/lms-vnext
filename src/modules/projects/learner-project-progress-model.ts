export type LearnerProjectTaskStatus = { projectId: string; status: string };
export type LearnerProjectProgress = {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  percentage: number | null;
};
/** A project without tracked tasks has unknown progress, not 0%. */
export function summarizeLearnerProjectProgress(
  projectIds: readonly string[],
  tasks: readonly LearnerProjectTaskStatus[],
): LearnerProjectProgress[] {
  const byId = new Map<string, { total: number; done: number; blocked: number }>(
    projectIds.map(id => [id, {total:0,done:0,blocked:0}]),
  );
  for (const task of tasks) {
    const item = byId.get(task.projectId);
    if (!item) continue;
    item.total++;
    if (task.status === "DONE") item.done++;
    if (task.status === "BLOCKED") item.blocked++;
  }
  return projectIds.map(projectId => {
    const item = byId.get(projectId)!;
    return {projectId,totalTasks:item.total,completedTasks:item.done,
      blockedTasks:item.blocked,
      percentage:item.total ? Math.round(item.done * 100 / item.total) : null};
  });
}
