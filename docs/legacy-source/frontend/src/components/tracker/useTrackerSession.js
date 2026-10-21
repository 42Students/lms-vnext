import { useCallback, useEffect, useState } from "react";
import { exchangeTrackerAccess, getTrackerSession, logoutTrackerSession } from "@/api/Services/BugTrackerService";
import { cleanTrackerAccessHash, trackerAccessTokenFromHash } from "@/utils/bugTrackerUtils";

export default function useTrackerSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState("");

  const refresh = useCallback(async () => {
    const current = await getTrackerSession();
    setSession(current);
    setAccessError("");
    return current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setLoading(true);
      const accessToken = typeof window !== "undefined"
        ? trackerAccessTokenFromHash(window.location.hash)
        : null;
      try {
        const current = accessToken
          ? await exchangeTrackerAccess(accessToken)
          : await getTrackerSession();
        if (accessToken) cleanTrackerAccessHash();
        if (!cancelled) {
          setSession(current);
          setAccessError("");
        }
      } catch (error) {
        if (accessToken) cleanTrackerAccessHash();
        if (!cancelled) {
          setSession(null);
          setAccessError(
            error?.status === 401
              ? "This browser does not have tracker access yet. Open your personal 42 Tracker link once."
              : "Tracker access could not be verified. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const logout = useCallback(async () => {
    try { await logoutTrackerSession(); } catch (_) {}
    setSession(null);
    setAccessError("Tracker access was cleared from this browser. Open your personal access link to reconnect.");
  }, []);

  return { session, loading, accessError, refresh, logout };
}
