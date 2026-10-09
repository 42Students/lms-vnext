/**
 * Notification actions are application-internal navigation only.
 * Database rows may predate current validation, so apply this policy
 * both when accepting a new delivery and when returning stored rows.
 */
export function safeNotificationActionHref(
  value: string | null | undefined,
): string | null {
  if (
    !value ||
    value.length > 1000 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\x00-\x1f\x7f]/.test(value)
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, "https://lms-vnext.invalid");
    if (parsed.origin !== "https://lms-vnext.invalid") {
      return null;
    }
  } catch {
    return null;
  }

  return value;
}
