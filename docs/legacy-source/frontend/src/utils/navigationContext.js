const firstString = (value) => {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : null;
  return typeof value === "string" ? value : null;
};

/**
 * True only for a path on this site: starts with one "/", no backslashes or control characters (browsers strip tabs and
 * newlines, which turned "/\t/evil.com" into "//evil.com"), and, where a browser is available, resolves to this origin.
 */
export function isSameSiteRelativePath(path) {
  if (typeof path !== "string" || !path) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F\\]/.test(path)) return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (typeof window !== "undefined" && window.location?.origin) {
    try {
      if (new URL(path, window.location.origin).origin !== window.location.origin) return false;
    } catch (_) {
      return false;
    }
  }
  return true;
}

export function getSafeInternalReturnPath(
  value,
  { fallback = "/", allowedPrefixes = [] } = {}
) {
  const raw = firstString(value);
  if (!raw) return fallback;
  const path = raw.trim();
  if (!isSameSiteRelativePath(path)) {
    return fallback;
  }

  const pathname = path.split(/[?#]/, 1)[0];
  if (
    Array.isArray(allowedPrefixes) &&
    allowedPrefixes.length > 0 &&
    !allowedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return fallback;
  }

  return path;
}

export function withReturnTo(href, returnTo) {
  const target = typeof href === "string" ? href : "";
  const safeReturn = getSafeInternalReturnPath(returnTo, { fallback: "" });
  if (!target || !safeReturn) return target;
  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}returnTo=${encodeURIComponent(safeReturn)}`;
}
