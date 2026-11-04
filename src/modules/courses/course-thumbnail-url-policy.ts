/**
 * Shared browser/server boundary for authored course cover image locations.
 * Course images are requested by learners, so do not turn an untrusted cover
 * field into a request to local hosts, literal IPs, credentialed URLs or
 * non-HTTPS schemes. This is not a network egress/SSRF protection mechanism:
 * the browser follows DNS, so deployment egress and CSP remain independent.
 */
const PRIVATE_DNS_SUFFIXES = new Set([
  "localhost", "local", "internal", "lan", "home",
  "arpa", "invalid", "test", "onion",
]);

const HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// Public course metadata is durable, so a short-lived object-store capability
// must never be stored and disclosed as a learner-facing thumbnail URL.
const PRIVATE_IMAGE_QUERY_KEY = /^(?:x-amz-|x-goog-|x-ms-|awsaccesskeyid$|googleaccessid$|cloudfront-|signature$|sig$|token$|access[_-]?token$|refresh[_-]?token$|api[_-]?key$|apikey$|auth$|authorization$|credential$|password$|secret$|jwt$|key$|policy$|expires$)/i;

/** Only external, public-looking HTTPS image locations may be persisted. */
export function safePublicCourseThumbnailUrl(raw: string): string | null {
  if (!raw || raw.length > 2048 || raw.trim() !== raw ||
      /[\u0000-\u001f\u007f\\]/.test(raw)) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password ||
        url.hash || url.port || !host || host.startsWith("[") ||
        !HOSTNAME.test(host)) return null;
    const suffix = host.slice(host.lastIndexOf(".") + 1);
    // URL canonicalizes alternative IPv4 notation. Requiring a DNS name
    // (not an IP literal) also rejects octal/hex/dword IPv4 and all IPv6.
    if (!/[a-z]/.test(suffix) || PRIVATE_DNS_SUFFIXES.has(suffix)) return null;
    for (const key of url.searchParams.keys()) {
      if (PRIVATE_IMAGE_QUERY_KEY.test(key)) return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

/**
 * The only relative image URL accepted is our authenticated, scanned,
 * course-scoped image reader. Authorization remains enforced by that route.
 */
export function safeVerifiedCourseImagePath(raw: string): string | null {
  return /^\/api\/courses\/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\/image$/i.test(raw)
    ? raw : null;
}
