import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;

/**
 * Load one resource with the three states every panel needs: loading, a real error with Retry, and data.
 * A failed load is never turned into an empty list, and a refresh that fails keeps the last good data
 * (`stale` is true) so the screen does not go blank under the user.
 *
 *   const { data, error, loading, stale, retry } = useLoad(() => getReport(...), [seasonId], { fallback: "Could not load" });
 */
export function useLoad(call, deps = [], { fallback = "Could not load this", initial = null, map } = {}) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const callRef = useRef(call);
  callRef.current = call;

  const run = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    const res = await fetchWithErrorHandling(callRef.current());
    if (mine !== seq.current) return; // a newer load superseded this one
    setLoading(false);
    if (!res.success) { setError(errorText(res, fallback)); return; }
    setError(null);
    setData(map ? map(res.data) : res.data);
  }, [fallback, map]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);

  return { data, error, loading, stale: Boolean(error) && data !== initial, retry: run, setData };
}
