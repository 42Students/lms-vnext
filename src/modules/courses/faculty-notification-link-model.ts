/** Notification destinations are persisted data, not trusted navigation.
 * Faculty pages must never open another account surface or an external origin. */
export function facultyNotificationActionHref(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") ||
      raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) {
    return null;
  }
  try {
    const parsed = new URL(raw, "https://faculty.invalid");
    if (parsed.origin !== "https://faculty.invalid" ||
        !/^\/(teacher|teach)(\/|$)/.test(parsed.pathname)) {
      return null;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}
