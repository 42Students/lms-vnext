import { renderHook, waitFor } from "@testing-library/react";
import useDependencyCounts, { runPooled, MAX_IN_FLIGHT } from "@/components/admin/useDependencyCounts";

// BE-0089/BE-0128: count lookups are pooled, remembered, and failures are retried, not cached.
test("runPooled never runs more than the limit at once", async () => {
  let running = 0;
  let peak = 0;
  const tasks = Array.from({ length: 12 }, (_, i) => async () => {
    running += 1; peak = Math.max(peak, running);
    await new Promise((r) => setTimeout(r, 5));
    running -= 1;
    return i;
  });
  const out = await runPooled(tasks, 3);
  expect(out).toEqual([...Array(12).keys()]);
  expect(peak).toBe(3);
  expect(MAX_IN_FLIGHT).toBe(4);
});

test("a known count is not asked again; a failed one is", async () => {
  const lessons = jest.fn()
    .mockResolvedValueOnce({ data: [1, 2] })      // row 1
    .mockRejectedValueOnce(new Error("500"))      // row 2 fails
    .mockResolvedValueOnce({ data: [1] });        // row 2 again
  const rowsA = [{ id: 1 }, { id: 2 }];
  const { result, rerender } = renderHook(({ rows }) => useDependencyCounts(rows, { lessons }, { resetKey: 6 }), { initialProps: { rows: rowsA } });
  await waitFor(() => expect(result.current[1]).toEqual({ lessons: 2 }));
  expect(result.current[2]).toEqual({ lessons: null });
  rerender({ rows: [{ id: 2 }, { id: 1 }] }); // a reload with the same rows in another order
  await waitFor(() => expect(result.current[2]).toEqual({ lessons: 1 }));
  expect(lessons).toHaveBeenCalledTimes(3); // row 1 was not asked again
});
