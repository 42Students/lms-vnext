/** Build one in-memory index for a paged project query.
 * Avoid rescanning every task, submission, mentor and activity row for each
 * project in the visible admin page. Preserves SQL order and never mutates rows.
 */
export function groupProjectAdminRows<T extends { projectId: string }>(
  rows: readonly T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const existing = grouped.get(row.projectId);
    if (existing) existing.push(row);
    else grouped.set(row.projectId, [row]);
  }
  return grouped;
}
