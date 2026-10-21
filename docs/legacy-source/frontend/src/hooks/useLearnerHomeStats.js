import { useState, useEffect, useCallback, useRef } from "react";
import { getLearnerCourseHomeStats } from "@/api/Services/courseServices";

/**
 * Fetches learner course home stats for the dashboard.
 * Supports request cancellation and ignores stale responses.
 * @param {{ courseSlug?: string, courseId?: number }} params - courseSlug (preferred) or courseId
 * @returns {{ data: object | null, loading: boolean, error: Error | null, refetch: () => void }}
 */
export function useLearnerHomeStats(params) {
  const { courseSlug, courseId } = params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const loadedScopeRef = useRef(null);
  const scopeKey = courseSlug
    ? `slug:${courseSlug}`
    : courseId != null
      ? `id:${courseId}`
      : null;

  const fetchStats = useCallback(() => {
    if (!scopeKey) {
      requestIdRef.current += 1;
      loadedScopeRef.current = null;
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    const scopeChanged = loadedScopeRef.current !== scopeKey;
    if (scopeChanged) setData(null);
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    getLearnerCourseHomeStats({ courseSlug, courseId, signal: controller.signal })
      .then(response => {
        if (requestId !== requestIdRef.current) return;
        const payload = response?.data ?? response;
        setData(payload);
        loadedScopeRef.current = scopeKey;
        setError(null);
      })
      .catch(err => {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        if (requestId !== requestIdRef.current) return;
        setError(err);
        if (loadedScopeRef.current !== scopeKey) setData(null);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
    return () => controller.abort();
  }, [courseSlug, courseId, scopeKey]);

  useEffect(() => {
    const cancel = fetchStats();
    return () => {
      if (typeof cancel === "function") cancel();
    };
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}
