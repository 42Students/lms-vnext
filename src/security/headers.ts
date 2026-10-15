const isDevelopmentBuild = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy. Next.js injects inline bootstrap scripts, so
 * script-src keeps 'unsafe-inline' until nonce-based CSP is adopted; every
 * other directive is locked down. 'unsafe-eval' is only added for the dev
 * server (React refresh needs it). www.youtube.com is allowed for script-src
 * only because the lesson player loads https://www.youtube.com/iframe_api.
 */
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
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=15552000",
  },
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY,
  },
] as const;
