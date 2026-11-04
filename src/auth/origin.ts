/**
 * Same-origin write guard for platform and verified college hosts.
 *
 * Use the actual Host (not client-supplied X-Forwarded-Host) as the target
 * authority. Treat Host strictly as an authority, never as a complete URL:
 * parsing "https://" + a crafted Host without validating its characters can
 * silently discard URL userinfo, query and fragment components.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || host.trim() !== host ||
      /[\s,\/\\@?#%]/u.test(host)) return false;

  try {
    const submitted = new URL(origin);
    // Origin must be a single serialized origin without path, query or hash.
    if (origin !== submitted.origin) return false;
    const target = new URL("https://" + host);
    if (target.username || target.password || target.pathname !== "/" ||
        target.search || target.hash) return false;
    if (submitted.host.toLowerCase() !== target.host.toLowerCase()) return false;
    if (submitted.protocol === "https:") return true;

    // A development HTTP exception is only for loopback hosts, never
    // prefix matches such as localhost.attacker.test or 127.0.0.1.evil.
    const hostname = target.hostname.toLowerCase();
    const isLoopback = hostname === "localhost" ||
      hostname === "127.0.0.1" || hostname === "[::1]";
    return process.env.NODE_ENV !== "production" &&
      submitted.protocol === "http:" && isLoopback &&
      new URL(request.url).protocol === "http:";
  } catch {
    return false;
  }
}
