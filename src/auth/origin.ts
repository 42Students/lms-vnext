/**
 * Same-origin write guard for both platform and verified custom college hosts.
 * Trust the actual Host header, never the client-supplied forwarded hostname.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || host.trim() !== host || host.includes(",") ||
      host.includes("/") || host.includes("\\") || host.includes(" ")) return false;
  try {
    const submitted = new URL(origin);
    if (origin !== submitted.origin) return false;
    const expectedHost = new URL("https://" + host).host;
    if (submitted.host.toLowerCase() !== expectedHost.toLowerCase()) return false;
    if (submitted.protocol === "https:") return true;
    const isLocalHost = host.toLowerCase().startsWith("localhost") ||
      host.startsWith("127.0.0.1") || host.startsWith("[::1]");
    return process.env.NODE_ENV !== "production" &&
      submitted.protocol === "http:" && isLocalHost &&
      new URL(request.url).protocol === "http:";
  } catch {
    return false;
  }
}
