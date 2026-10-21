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
}[]): string {
  const hash = createHash("sha256");
  for (const task of [...tasks].sort((a, b) => a.id.localeCompare(b.id))) {
    hash.update(JSON.stringify([
      task.id, task.updatedAt.toISOString(), task.status,
      task.sprintId, task.sequence, task.deletedAt?.toISOString() ?? null,
    ]) + "\n");
  }
  return hash.digest("hex");
}
