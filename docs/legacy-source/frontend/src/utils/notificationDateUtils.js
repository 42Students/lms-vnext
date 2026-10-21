import { monthNames } from "@/common/lists";

/**
 * Format notification created_at for display.
 * Handles: [year, month0Based, day] (from API DTO) or ISO date string (legacy).
 * @param {Array<number>|string|undefined} created_at
 * @returns {string} e.g. "15 January , 2024" or "—" if unparseable
 */
export function formatNotificationDate(created_at) {
  if (created_at == null) return "—";
  if (Array.isArray(created_at) && created_at.length >= 3) {
    const year = created_at[0];
    const month0 = created_at[1];
    const day = created_at[2];
    // monthNames (src/common/lists.js) is 1-indexed (index 1 = January), but the backend DTOs
    // (NotificationResponseDTO/AnnouncementResponseDTO) emit a 0-indexed month via
    // getMonthValue() - 1 — indexing monthNames directly with that was off by one for every
    // month, and rendered the literal number "0" instead of "January".
    const monthLabel = monthNames[month0 + 1] ?? "—";
    return `${day} ${monthLabel}, ${year}`;
  }
  if (typeof created_at === "string") {
    try {
      const d = new Date(created_at);
      if (!Number.isNaN(d.getTime())) {
        return `${d.getDate()} ${monthNames[d.getMonth() + 1] ?? "—"}, ${d.getFullYear()}`;
      }
    } catch (_) {
      // ignore
    }
  }
  return "—";
}
