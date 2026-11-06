/**
 * Central rule for file downloads (docs/security/central-security-architecture.md, layer L6).
 *
 * Any response that carries `Content-Disposition: attachment` is an export. The wrappers harden it in one place
 * (no caching anywhere, no content sniffing) and audit it as an export, so every one of the ~120 download routes
 * is covered without each route repeating the headers or remembering to log.
 */
export function isDownload(response: unknown): response is Response {
  return response instanceof Response && /^\s*attachment\b/i.test(response.headers.get("content-disposition") ?? "");
}

/** Forces the safe headers on a download. Immutable (proxied) responses are left unchanged. */
export function hardenDownload(response: Response): void {
  try {
    // Keep a route's own strict value (several are asserted verbatim); only a missing or weaker one is replaced.
    const cacheControl = response.headers.get("Cache-Control") ?? "";
    if (!/no-store/i.test(cacheControl) || !/private/i.test(cacheControl)) response.headers.set("Cache-Control", "private, no-store");
    if (response.headers.get("X-Content-Type-Options")?.toLowerCase() !== "nosniff") response.headers.set("X-Content-Type-Options", "nosniff");
  } catch {
    /* immutable headers */
  }
}
