import { API_URL } from "@/config/appConfig";
import { getAccessToken } from "@/utils/authUtils";

// Deliberately bypasses the shared `Api` axios instance and its response interceptor: that
// interceptor is what reports failed API calls in the first place (see ApiMethod.js), so routing
// this call through it would mean a failed report attempts to report its own failure -- an
// infinite loop the moment the reporting endpoint itself is unreachable. Plain fetch, best-effort,
// never throws into the caller.
export function reportClientError(payload) {
  try {
    const token = getAccessToken();
    if (!token || typeof window === "undefined") return;
    fetch(`${API_URL}/api/v1/client-errors/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      credentials: "include",
      body: JSON.stringify(payload),
      // Lets the report still go out even if the page is navigating away right after (e.g. a
      // resource failure discovered during unload) -- same rationale as video.js's beforeunload save.
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Reporting a client error must never itself throw -- that would just be a second bug.
  }
}
