import { mergeRunResults } from "@/components/tpo/bulk/BulkAction";

// BE-0118: undo after a Retry sees every run's snapshot.
test("one-call results join their 'before' rows across runs", () => {
  const first = { success: true, data: { before: [{ learnerId: 1, choice: "PLACEMENTS" }, { learnerId: 2, choice: "PLACEMENTS" }], skipped: [3] } };
  const retry = { success: true, data: { before: [{ learnerId: 3, choice: "HIGHER_STUDIES" }], skipped: [] } };
  const merged = mergeRunResults([first, retry]);
  expect(merged.data.before.map((b) => b.learnerId)).toEqual([1, 2, 3]);
  expect(merged.success).toBe(true);
});

test("per-row results are joined, and a single run passes through", () => {
  expect(mergeRunResults([[{ item: 1 }], [{ item: 2 }]])).toEqual([{ item: 1 }, { item: 2 }]);
  const only = { data: { before: [1] } };
  expect(mergeRunResults([only])).toBe(only);
});
