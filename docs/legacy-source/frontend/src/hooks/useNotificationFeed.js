import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { getAllNotificationByClassId } from "@/api/Services/UserServices";
import { isLearnerRole } from "@/utils/roleUtils";
import { API_URL } from "@/config/appConfig";

// SSE timeout is 12 min — reconnect just before it fires so we get a clean cycle.
const RECONNECT_INTERVAL_MS = 11 * 60 * 1000;
const MAX_ERRORS = 5;

/**
 * Single source of truth for the learner notification feed (list + live updates), shared by
 * every surface that shows a notification badge/list — the header dropdown and the mobile
 * footer previously each ran their own independent fetch (and only the header had live SSE
 * updates), so the two could show different counts at the same time and both hit the backend
 * on every mount.
 */
export function useNotificationFeed() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const isLearner = isLearnerRole(loginUser);
  const [data, setData] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const fetchAborted = useRef(false);

  const shouldSkipApiCalls = router.pathname === "/superadmin";

  const fetchNotifications = useCallback(() => {
    if (shouldSkipApiCalls) return;
    if (!isLearner || !loginUser?.isUserLoggedIn || !loginUser?.classId) {
      setData(null);
      setHasLoaded(false);
      setError(false);
      return;
    }

    fetchAborted.current = false;
    setLoading(true);
    setError(false);

    getAllNotificationByClassId({ classId: loginUser.classId })
      .then((resData) => {
        if (fetchAborted.current) return;
        const list = Array.isArray(resData?.data)
          ? resData.data
          : resData && typeof resData === "object" && !resData.status
            ? []
            : resData ?? [];
        setData(Array.isArray(list) ? list : []);
        setHasLoaded(true);
      })
      .catch(() => {
        if (!fetchAborted.current) {
          // A refresh failure is not an empty feed. Preserve the last-good list so an
          // already-open drawer does not suddenly blank while the user is reading it.
          setError(true);
        }
      })
      .finally(() => {
        if (!fetchAborted.current) setLoading(false);
      });
  }, [shouldSkipApiCalls, isLearner, loginUser?.isUserLoggedIn, loginUser?.classId]);

  useEffect(() => {
    fetchNotifications();
    return () => {
      fetchAborted.current = true;
    };
  }, [fetchNotifications]);

  // SSE: receive new notifications in real time (replaces 60s polling).
  useEffect(() => {
    if (shouldSkipApiCalls || !isLearner || !loginUser?.isUserLoggedIn || !loginUser?.classId) return;

    const token = loginUser?.token || loginUser?.accessToken;
    if (!token) return;

    const baseUrl = (API_URL || "").replace(/\/$/, "");
    const url = `${baseUrl}/api/v1/notification/subscribe?classId=${loginUser.classId}&token=${encodeURIComponent(token)}`;

    let es = null;
    let errorCount = 0;
    let reconnectTimer = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      es = new EventSource(url);

      es.addEventListener("notification", (e) => {
        errorCount = 0; // reset on successful message
        try {
          const incoming = JSON.parse(e.data);
          // A valid live event is successful feed data even if the initial HTTP fetch
          // failed. Let the drawer recover immediately instead of staying in fatal-load UI.
          setHasLoaded(true);
          setError(false);
          if (incoming?.type === "notification_deleted") {
            setData((prev) => (Array.isArray(prev) ? prev.filter((n) => n.id !== incoming.id) : prev));
            return;
          }
          setData((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            if (incoming?.id && list.some((n) => n.id === incoming.id)) return list;
            return [incoming, ...list];
          });
        } catch (_) {}
      });

      es.onerror = () => {
        errorCount++;
        if (errorCount >= MAX_ERRORS) {
          // Too many consecutive errors (likely auth failure or server down) — stop
          // reconnecting to avoid hammering the backend.
          es.close();
          closed = true;
        }
      };
    };

    connect();

    // Proactively reconnect before the 12-min SSE timeout so token stays valid.
    reconnectTimer = setInterval(() => {
      if (closed) return;
      if (es) es.close();
      errorCount = 0;
      connect();
    }, RECONNECT_INTERVAL_MS);

    return () => {
      closed = true;
      clearInterval(reconnectTimer);
      if (es) es.close();
    };
  }, [loginUser?.classId, loginUser?.isUserLoggedIn, loginUser?.token, loginUser?.accessToken, isLearner, shouldSkipApiCalls]);

  return { data, hasLoaded, loading, error, refetch: fetchNotifications };
}
