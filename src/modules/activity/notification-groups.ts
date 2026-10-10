/**
 * Client-safe date grouping. Uses the calendar date in the LMS's India timezone,
 * not UTC midnight, so a notification at 00:30 IST is grouped correctly.
 * Display buckets match the legacy TPO notification feed.
 */
export type NotificationDateGroup<T> = {
  label: "Today" | "Yesterday" | "This week" | "Earlier";
  items: T[];
};

function dateInIndia(instant: Date): string | null {
  if (!Number.isFinite(instant.getTime())) return null;
  const tokens = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (kind: string) => tokens.find((token) => token.type === kind)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function notificationDateLabel(
  createdAt: string,
  now: Date,
): NotificationDateGroup<unknown>["label"] {
  const instant = new Date(createdAt);
  const today = dateInIndia(now);
  const day = dateInIndia(instant);
  if (!today || !day) return "Earlier";
  if (day === today) return "Today";
  const yesterday = dateInIndia(new Date(now.getTime() - 86_400_000));
  if (day === yesterday) return "Yesterday";
  if (instant.getTime() <= now.getTime() &&
      instant.getTime() > now.getTime() - 7 * 86_400_000) {
    return "This week";
  }
  return "Earlier";
}

export function groupNotificationsByDate<T extends { createdAt: string }>(
  items: readonly T[],
  now: Date,
): Array<NotificationDateGroup<T>> {
  const labels = ["Today", "Yesterday", "This week", "Earlier"] as const;
  const groups = new Map<NotificationDateGroup<T>["label"], T[]>(
    labels.map((label) => [label, []] as const),
  );
  for (const item of items) {
    groups.get(notificationDateLabel(item.createdAt, now))!.push(item);
  }
  return labels
    .filter((label) => groups.get(label)!.length > 0)
    .map((label) => ({ label, items: groups.get(label)! }));
}
