import { switchOrg } from "@/api/Services/AuthOrgService";
import { broadcastOrgSwitch, refreshAccessToken, setAccessToken, setRefreshToken } from "@/utils/authUtils";

/**
 * Switch the session to another membership (for recruiter: Global or one of their colleges) using the
 * same /auth/switch contract as the header switcher. Same-host switches refresh the session and
 * reload `nextPath`; cross-host switches go through /auth/handoff on the target host.
 * Resolves false when the switch could not be started (caller shows the error).
 */
export async function switchToMembership(targetKey, nextPath) {
  if (!targetKey || typeof window === "undefined") return false;
  try { localStorage.setItem("lms_last_membership_key", String(targetKey)); } catch (_) {}
  const res = await switchOrg(targetKey);
  const payload = res?.data?.data ?? res?.data ?? null;
  if (!payload || payload.error) return false;
  if (typeof payload.accessToken === "string" && payload.accessToken) setAccessToken(payload.accessToken);
  if (typeof payload.refreshToken === "string" && payload.refreshToken) setRefreshToken(payload.refreshToken);
  try { broadcastOrgSwitch(); } catch (_) {}

  const sameHost = payload.switchType === "SAME_HOST" || payload.hostChange === false;
  if (sameHost) {
    try { await refreshAccessToken(); } catch (_) {}
    window.location.assign(nextPath || window.location.pathname);
    return true;
  }
  const host = typeof payload.targetHost === "string" ? payload.targetHost.replace(/^https?:\/\//i, "").split("/")[0] : "";
  if (!host || !payload.handoffToken) return false;
  const next = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";
  window.location.href = `${window.location.protocol}//${host}/auth/handoff?token=${encodeURIComponent(payload.handoffToken)}${next}`;
  return true;
}
