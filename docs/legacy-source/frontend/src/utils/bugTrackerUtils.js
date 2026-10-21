export function trackerAccessTokenFromHash(hash) {
  const raw = String(hash || "").replace(/^#/, "");
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const token = params.get("access");
  return token && token.trim() ? token.trim() : null;
}

export function cleanTrackerAccessHash() {
  if (typeof window === "undefined") return;
  const clean = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, document.title, clean);
}

export function locationPathToFields(path) {
  const values = Array.isArray(path) ? path.filter(Boolean) : [];
  return {
    page: values[0] || "",
    screen: values[1] || null,
    section: values[2] || null,
  };
}

export function trackerLocationText(issue) {
  return [issue?.page, issue?.screen, issue?.section].filter(Boolean).join(" › ");
}

export function formatTrackerDate(value) {
  if (!value) return "";
  // The backend serializes LocalDateTime as [y, m, d, h, mi, s, nanos] (m is 1-based, server clock is UTC).
  const date = Array.isArray(value)
    ? new Date(Date.UTC(value[0], (value[1] || 1) - 1, value[2] || 1, value[3] || 0, value[4] || 0, value[5] || 0))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Client-side convenience only, not a real access boundary: hides the status/retest/engineering
 * controls for visitors who obviously aren't a super admin, so anonymous reporters don't see
 * interactive-looking controls that would now correctly fail server-side. The actual protection is
 * the backend's own super-admin check on /api/v1/superadmin/bug-tracker -- this must never be relied
 * on as the real gate. Mirrors the same userData.id === 0 check TrackerShell already uses for the
 * Logs nav link.
 */
export function isTrackerManagerClientHint() {
  if (typeof window === "undefined") return false;
  try {
    const userData = JSON.parse(localStorage.getItem("userData") || "null");
    return userData?.id === 0;
  } catch (_) {
    return false;
  }
}

/** Clipboard write with a textarea fallback for plain-http tabs and older browsers. Throws on failure. */
export async function copyTextToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("Copy failed");
}
