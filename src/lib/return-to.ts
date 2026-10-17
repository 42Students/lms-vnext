/**
 * GR-15: preserve the intended LMS page after session expiry without
 * accepting protocol-relative, external, sign-in or API redirects.
 * Usage: safeReturnTo(new URLSearchParams(location.search).get("returnTo")).
 */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return null;
  try {
    const resolved = new URL(value, "https://lms.invalid");
    if (resolved.origin !== "https://lms.invalid" ||
        resolved.pathname.startsWith("/api/") ||
        resolved.pathname === "/login" ||
        resolved.pathname === "/") return null;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch { return null; }
}

export function sessionExpiredHref(currentPath: string, reason: "expired" | "revoked" = "expired") {
  const target = safeReturnTo(currentPath);
  return `/?auth=${reason}${target ? `&returnTo=${encodeURIComponent(target)}` : ""}`;
}
