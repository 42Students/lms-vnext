const identityOf = (task) => task?.taskKey ?? task?.taskId ?? task?._clientId ?? task?.id;

/** Stable across template-task materialization, where the database id appears mid-move. */
export function findProjectBoardTask(tasks, originalTask) {
  const stableIdentity = identityOf(originalTask);
  if (stableIdentity == null) return null;
  return (Array.isArray(tasks) ? tasks : []).find((task) =>
    String(identityOf(task)) === String(stableIdentity)) || null;
}

/**
 * Restore ONLY the moved task's former status/sprint/order. Round-trip all unrelated task
 * attributes from the freshly fetched server row, never from the pre-move render closure.
 * The caller must first verify the task's version has not changed since its own move.
 */
export function buildProjectBoardUndoPayload(beforeTask, currentTask) {
  const originalSprint = beforeTask?.sprintKey ?? beforeTask?.sprintId ?? null;
  return {
    version: currentTask.version,
    title: currentTask.title,
    description: currentTask.description || "",
    assigneeId: currentTask.assigneeId ?? null,
    assigneeName: currentTask.assigneeName || "",
    status: beforeTask.status || "To Do",
    priority: currentTask.priority || "Medium",
    dueLabel: currentTask.dueLabel || currentTask.due || "TBD",
    sprintKey: originalSprint,
    sprintLabel: originalSprint ? beforeTask.sprintLabel || "" : "",
    clearSprint: originalSprint == null,
    taskKey: currentTask.taskKey || currentTask.taskId || currentTask._clientId || String(currentTask.id),
    sortOrder: beforeTask.sortOrder ?? 0,
    blockerReason: String(beforeTask.status || "").toLowerCase().includes("block")
      ? beforeTask.blockerReason || ""
      : "",
  };
}
