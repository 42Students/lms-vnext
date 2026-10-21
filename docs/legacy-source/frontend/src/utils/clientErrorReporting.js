import { reportClientError } from "@/api/Services/ClientErrorReportService";

const DEDUPE_KEY = "42lms_client_error_dedupe_v1";
const DEDUPE_WINDOW_MS = 60_000;
let initialized = false;

function getEnrichment() {
  if (typeof window === "undefined") return {};
  return {
    page: window.location.pathname,
    buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || "unknown",
    browser: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

// The same render-loop bug (or the same broken third-party script) can throw hundreds of times a
// second. Without this, one broken client would hammer the reporting endpoint -- the backend's own
// per-account rate limit is the real backstop, but deduping here first means a single misbehaving
// tab doesn't burn through that limit on ITS OWN repeats before anything else has a chance to report.
function shouldReport(dedupeKey) {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.sessionStorage.getItem(DEDUPE_KEY);
    const seen = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const lastSeen = seen[dedupeKey];
    if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) return false;
    seen[dedupeKey] = now;
    // Keep the map from growing unboundedly over a long session.
    const entries = Object.entries(seen);
    if (entries.length > 200) {
      const trimmed = Object.fromEntries(entries.slice(-100));
      window.sessionStorage.setItem(DEDUPE_KEY, JSON.stringify(trimmed));
    } else {
      window.sessionStorage.setItem(DEDUPE_KEY, JSON.stringify(seen));
    }
    return true;
  } catch {
    return true; // sessionStorage unavailable (private mode, quota) -- report anyway rather than go silent.
  }
}

function report(type, message, stack, extra = {}) {
  const safeMessage = String(message ?? "(no message)").slice(0, 2000);
  const dedupeKey = `${type}::${safeMessage}::${extra.endpoint || window?.location?.pathname || ""}`;
  if (!shouldReport(dedupeKey)) return;
  reportClientError({
    type,
    message: safeMessage,
    stack: stack ? String(stack).slice(0, 4000) : undefined,
    ...getEnrichment(),
    ...extra,
  });
}

export function reportJsError(message, stack) {
  report("JS_ERROR", message, stack);
}

// Unsaved-changes guards abort a Next.js route change by throwing "Route change aborted ..." when the user
// chooses to stay. Next surfaces that as an unhandled rejection; it is a deliberate cancel, not an error.
export const isAbortedRouteChange = (reason) => typeof reason === "string" && reason.startsWith("Route change aborted");

export function reportUnhandledRejection(reason) {
  if (isAbortedRouteChange(reason)) return;
  const message = reason?.message || String(reason);
  const stack = reason?.stack;
  report("UNHANDLED_REJECTION", message, stack);
}

export function reportReactBoundaryError(error, info) {
  report("JS_ERROR", error?.message || String(error), error?.stack || info?.componentStack);
}

export function reportConsoleError(args) {
  // console.error is frequently called with an Error object, a plain string, or a mix -- take the
  // best message we can get without trying to be clever about every possible call shape.
  const first = args?.[0];
  const message = first instanceof Error ? first.message : String(first ?? "(console.error)");
  const stack = first instanceof Error ? first.stack : undefined;
  report("CONSOLE_ERROR", message, stack);
}

export function reportResourceLoadFailure(target) {
  const src = target?.src || target?.href || "(unknown resource)";
  report("RESOURCE_LOAD_FAILURE", `Failed to load ${target?.tagName || "resource"}: ${src}`, null);
}

export function reportApiFailure({ endpoint, method, statusCode, message }) {
  report("API_FAILURE", message || `Request failed`, null, { endpoint: `${method || ""} ${endpoint || ""}`.trim(), statusCode });
}

export function reportAuthFailureMidAction(page) {
  report("AUTH_FAILURE", "Session expired while the user was mid-action", null, { page });
}

export function reportVideoPlaybackFailure(src, errorCode) {
  report("VIDEO_PLAYBACK_FAILURE", `Video failed to play (code ${errorCode ?? "unknown"}): ${src || "(unknown src)"}`, null);
}

export function reportFileUploadFailure({ fileName, endpoint, statusCode, message }) {
  report("FILE_UPLOAD_FAILURE", message || `Upload failed: ${fileName || "(unknown file)"}`, null, { endpoint, statusCode });
}

/**
 * Wires up window-level capture. Call once from _app.js. console.error is monkey-patched (wrapped,
 * never replaced/silenced) rather than only relying on window.onerror, since React and libraries
 * routinely report real problems via console.error without ever throwing an actual exception.
 */
export function initClientErrorReporting() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", (event) => {
    try {
      // Resource load failures (img/script/link) land here too, but with no `message` and a
      // `target` that isn't the window -- distinguish by checking for a target element.
      if (event.target && event.target !== window && event.target.tagName) {
        reportResourceLoadFailure(event.target);
        return;
      }
      reportJsError(event.message, event.error?.stack);
    } catch {}
  }, true); // capture phase: resource errors don't bubble.

  window.addEventListener("unhandledrejection", (event) => {
    try {
      // Unsaved-changes guards cancel a Next.js route change by throwing a "Route change aborted ..." string; that is the
      // user choosing to stay, not an error (prod log 2026-10-06 reported it as one).
      if (typeof event.reason === "string" && event.reason.startsWith("Route change aborted")) return;
      reportUnhandledRejection(event.reason);
    } catch {}
  });

  const originalConsoleError = console.error.bind(console);
  console.error = (...args) => {
    originalConsoleError(...args);
    // console.error must never itself throw -- huge amounts of app and library code call it
    // expecting that, so a bug in the reporting path here cannot be allowed to propagate out.
    try {
      reportConsoleError(args);
    } catch {}
  };
}
