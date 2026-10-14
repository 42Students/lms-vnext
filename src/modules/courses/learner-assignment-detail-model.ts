import { z } from "zod";

export const learnerAssignmentDetailQuery = z.object({
  assignmentId: z.string().uuid(),
  deliveryId: z.string().uuid(),
}).strict();

/** Select only an assignment from already-authorized Section delivery rows. */
export function findOwnLearnerAssignment<T extends { id: string; deliveryId: string }>(
  authorizedRows: readonly T[],
  raw: unknown,
): T | null {
  const query = learnerAssignmentDetailQuery.safeParse(raw);
  if (!query.success) return null;
  return authorizedRows.find(row =>
    row.id === query.data.assignmentId && row.deliveryId === query.data.deliveryId
  ) ?? null;
}