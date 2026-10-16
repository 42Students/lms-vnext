export type LearnerProjectTaskFacts = {
  assigneeMembershipId: string | null;
  dueDate: string | null;
  estimatePoints: number | null;
  taskType: string | null;
  blockerReason: string | null;
};
export function projectTaskDueLabel(date: string | null): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "No due date";
  const parsed = new Date(date + "T12:00:00.000Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return "No due date";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
  }).format(parsed);
}
export function projectTaskVisibleFacts(
  task: LearnerProjectTaskFacts,
  assigneeName: string | null,
) {
  return {
    assignee: task.assigneeMembershipId ? assigneeName ?? "Assigned member" : "Unassigned",
    dueDate: projectTaskDueLabel(task.dueDate),
    estimate: task.estimatePoints == null ? "Not estimated" : task.estimatePoints + " points",
    taskType: task.taskType ? task.taskType.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : "Not set",
    blockerReason: task.blockerReason?.trim() || null,
  };
}
