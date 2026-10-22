/** Match the legacy sortLessonContents tier comparator. A stored sequence wins
 * over any date, while heterogeneous imported rows without a sequence use
 * their creation time and then (only for old numeric IDs) their original ID.
 * Equal keys deliberately compare equal: Array#sort preserves authored input
 * order instead of using random UUIDs or item kind as an invented priority. */
export type LegacySortableLessonItem = {
  id: string;
  sequence?: number | null;
  createdAt?: Date | string | null;
};

function sortTier(item: LegacySortableLessonItem) {
  if (typeof item.sequence === "number" && Number.isFinite(item.sequence))
    return { rank: 0, value: item.sequence };
  const timestamp = item.createdAt instanceof Date
    ? item.createdAt.getTime()
    : item.createdAt ? new Date(item.createdAt).getTime() : Number.NaN;
  if (Number.isFinite(timestamp)) return { rank: 1, value: timestamp };
  const numericId = /^[0-9]+$/.test(item.id) ? Number(item.id) : Number.NaN;
  if (Number.isSafeInteger(numericId)) return { rank: 2, value: numericId };
  return { rank: 3, value: 0 };
}

export function compareLegacyLearnerLessonItems(
  left: LegacySortableLessonItem,
  right: LegacySortableLessonItem,
): number {
  const a = sortTier(left);
  const b = sortTier(right);
  if (a.rank !== b.rank) return a.rank - b.rank;
  if (a.value !== b.value) return a.value - b.value;
  const leftId = /^[0-9]+$/.test(left.id) ? Number(left.id) : Number.NaN;
  const rightId = /^[0-9]+$/.test(right.id) ? Number(right.id) : Number.NaN;
  return Number.isSafeInteger(leftId) && Number.isSafeInteger(rightId)
    ? leftId - rightId : 0;
}
