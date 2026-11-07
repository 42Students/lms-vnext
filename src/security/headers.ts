const isDevelopmentBuild = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy. Next.js injects inline bootstrap scripts, so
 * script-src keeps 'unsafe-inline' until nonce-based CSP is adopted; every
 * other directive is locked down. 'unsafe-eval' is only added for the dev
 * server (React refresh needs it). www.youtube.com is allowed for script-src
 * only because the lesson player loads https://www.youtube.com/iframe_api.
 */
/**
 * Per-request policy (SEC-12): scripts run only with this request's nonce, and 'strict-dynamic' lets those scripts load
 * the ones they need (the YouTube player). 'unsafe-inline' and the host list stay for browsers that do not understand
 * nonces and are ignored by those that do. The static policy below remains as the fallback for responses that do not pass
 * through the proxy.
 */
export function buildContentSecurityPolicy(nonce?: string) {
  if (!nonce) return CONTENT_SECURITY_POLICY;
  const evalPart = isDevelopmentBuild ? " 'unsafe-eval'" : "";
  return CONTENT_SECURITY_POLICY.replace(
    /script-src [^;]*/,
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self' 'unsafe-inline' https://www.youtube.com${evalPart}`,
  );
}

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.youtube.com${isDevelopmentBuild ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // College logos and learner media are https URLs; no plain http.
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/**
 * Conservative default for all API responses. Even public-looking endpoints
 * can carry user/college-specific data or short-lived signed resources as
 * their implementations evolve; do not leave confidentiality to individual
 * route authors remembering a Cache-Control header.
 *
 * This is cache isolation, NOT a substitute for authentication, RLS or
 * object-level authorization.
 */
export const PRIVATE_API_HEADERS = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
] as const;

export const BASE_SECURITY_HEADERS = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    // Isolates the browsing context group but keeps OAuth popups working.
    value: "same-origin-allow-popups",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY,
  },
] as const;
