/**
 * Safe, same-origin absolute path for user-facing Next.js links.
 * This is navigation validation, NOT route-level authorization. Never use a
 * valid URL as evidence that an actor may see the destination resource.
 */
export function isSafeInternalHref(href: string): boolean {
  if (!href.startsWith("/") || href !== href.trim() || /[\\\x00-\x1f\x7f]/.test(href)) {
    return false;
  }
  // A browser may normalize nested encoded initial slashes/backslashes as a
  // protocol-relative destination. Check through 16 encoding layers; fail
  // closed on deeper ambiguity. An ordinary encoded query may remain intact.
  let prefix = href.split(/[?#]/, 1)[0]!.slice(0, 128);
  for (let depth = 0; depth < 16; depth++) {
    if (prefix.startsWith("//") || prefix.startsWith("/\\") ||
        /[\\\x00-\x1f\x7f]/.test(prefix)) return false;
    const decoded = prefix.replace(/%2f/gi, "/")
      .replace(/%5c/gi, "\\").replace(/%25/gi, "%");
    if (decoded === prefix) return true;
    prefix = decoded;
  }
  return false;
}
