/**
 * Applies one status to many issues with a small concurrency cap (the tracker's own rate limiter
 * shouldn't be tripped by a 40-issue bulk edit) and reports per-issue outcomes instead of
 * failing the whole batch on the first error.
 */
export async function runBulkStatus(publicIds, status, updateFn, { concurrency = 3, onProgress } = {}) {
  const succeeded = [];
  const failed = [];
  let cursor = 0;
  let finished = 0;

  async function worker() {
    while (cursor < publicIds.length) {
      const id = publicIds[cursor];
      cursor += 1;
      try {
        await updateFn(id, status);
        succeeded.push(id);
      } catch (error) {
        failed.push({ id, message: error?.message || "Update failed" });
      }
      finished += 1;
      if (onProgress) onProgress({ done: finished, total: publicIds.length });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, publicIds.length) }, worker);
  await Promise.all(workers);
  return { succeeded, failed };
}
