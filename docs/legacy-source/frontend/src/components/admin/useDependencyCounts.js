import { useEffect, useRef, useState } from "react";

/**
 * Counts of what hangs off each row, for screens whose delete is guarded by exactly that.
 *
 * Departments, Programs, Batches, Classes and Semesters all refuse deletion while something still
 * references them — and every one of them only said so *after* the admin clicked Delete and got a
 * rejection. The admin then had to go hunting for what was in the way. Showing the same counts the
 * guard checks turns a rejected click into a visible reason.
 *
 * Each lookup settles independently and a failure resolves to null rather than throwing: one slow
 * or broken count must not blank a table, and "unknown" is an honest thing to render.
 *
 * BE-0089/BE-0128: callers pass only the rows on screen (the current table page), lookups run at most
 * MAX_IN_FLIGHT at a time, and a count already known for a row is kept (paging back doesn't ask again)
 * until `resetKey` changes (the college, or a save that changes what hangs off the rows).
 *
 * @param rows      the rows to count (the visible page)
 * @param loaders   { label: (row) => Promise } — one entry per dependency to count
 * @param options   { resetKey } — when it changes, every remembered count is dropped
 * @returns         { [rowId]: { label: number | null } }
 */
export const MAX_IN_FLIGHT = 4;

export async function runPooled(tasks, limit = MAX_IN_FLIGHT) {
  const results = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

const countOf = (res) => {
  const data = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(data)) return data.length;
  if (typeof data === "number") return data;
  if (Array.isArray(data?.content)) return data.content.length;
  return null;
};

export default function useDependencyCounts(rows, loaders, { resetKey = null } = {}) {
  const [counts, setCounts] = useState({});
  const known = useRef(new Map()); // rowId -> { label: count }
  const knownFor = useRef(resetKey);

  // Keyed on the row ids rather than the array identity: these tables re-create their row objects
  // on every fetch, and depending on the array itself would refetch every count on each render.
  const rowKey = Array.isArray(rows) ? rows.map((r) => r?.id).join(",") : "";
  const loaderKey = Object.keys(loaders || {}).join(",");

  useEffect(() => {
    if (knownFor.current !== resetKey) {
      known.current = new Map();
      knownFor.current = resetKey;
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      setCounts({});
      return undefined;
    }
    let cancelled = false;
    const labels = Object.keys(loaders || {});
    // A row whose count is unknown (a failed lookup) is asked again; a known count is kept.
    const missing = rows.filter((row) => row?.id != null && (!known.current.has(row.id) || labels.some((l) => known.current.get(row.id)[l] == null)));
    const show = () => setCounts(Object.fromEntries(rows.filter((r) => known.current.has(r?.id)).map((r) => [r.id, known.current.get(r.id)])));
    show();
    if (missing.length === 0) return undefined;
    (async () => {
      const tasks = missing.flatMap((row) => labels.map((label) => async () => {
        try {
          return [row.id, label, countOf(await loaders[label](row))];
        } catch {
          return [row.id, label, null];
        }
      }));
      const results = await runPooled(tasks);
      if (cancelled) return;
      results.forEach(([id, label, value]) => {
        known.current.set(id, { ...(known.current.get(id) || {}), [label]: value });
      });
      show();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowKey, loaderKey, resetKey]);

  return counts;
}
