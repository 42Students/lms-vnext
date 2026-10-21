import "server-only";

import { createHash } from "node:crypto";

/** Section CAS covers task membership, versions and workflow state, independent
 * of project.updatedAt and unrelated release/resource/meeting mutations.
 */
export function projectTaskPlanToken(tasks: readonly {
  id: string;
  updatedAt: Date;
  status: string;
  sprintId: string | null;
  sequence: number;
  deletedAt: Date | null;
  templateKey: string;
  legacyTaskKey: string | null;
  title: string;
  priority: string;
  description: string | null;
  dueLabel: string | null;
  acceptanceCriteria: string | null;
  approach: string | null;
  estimatePoints: number | null;
  taskType: string | null;
  dueDate: string | null;
  assigneeMembershipId: string | null;
  blockerReason: string | null;
}[]): string {
  const hash = createHash("sha256");
  for (const task of [...tasks].sort((a, b) => a.id.localeCompare(b.id))) {
    hash.update(JSON.stringify([
      task.id, task.updatedAt.toISOString(), task.status,
      task.sprintId, task.sequence, task.deletedAt?.toISOString() ?? null,
      task.templateKey, task.legacyTaskKey, task.title, task.priority,
      task.description, task.dueLabel, task.acceptanceCriteria, task.approach,
      task.estimatePoints, task.taskType, task.dueDate,
      task.assigneeMembershipId, task.blockerReason,
    ]) + "\n");
  }
  return hash.digest("hex");
}
