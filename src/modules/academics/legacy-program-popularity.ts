/** Process-local selection scores mirror the old in-memory search cache.
 * They are a ranking hint only, never a permission boundary. This state
 * does not contain users, sessions, email addresses or other personal data.
 * A restart resets counts, just as the retired Spring cache did.
 */
const scores = new Map<string, {count: number; touched: number}>();
const MAX_ENTRIES = 10_000;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function selectionKey(collegeId: string, programId: string) {
  return collegeId + ":" + programId;
}

export function recordScopedProgramSelection(collegeId: string, programId: string) {
  const now = Date.now();
  const key = selectionKey(collegeId, programId);
  const previous = scores.get(key);
  if (!previous && scores.size >= MAX_ENTRIES) {
    for (const [id, value] of scores) {
      if (now - value.touched > MAX_AGE_MS) scores.delete(id);
    }
    if (scores.size >= MAX_ENTRIES) scores.delete(scores.keys().next().value!);
  }
  scores.set(key, { count: Math.min(100_000, (previous?.count ?? 0) + 1), touched: now });
}

export function scopedProgramPopularity(collegeId: string, programId: string): number {
  const item = scores.get(selectionKey(collegeId, programId));
  return item && Date.now() - item.touched < MAX_AGE_MS ? item.count : 0;
}
