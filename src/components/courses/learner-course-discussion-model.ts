export type DiscussionFeedItem = {
  id: string;
  senderMembershipId: string;
  createdAt: string;
};

export type DiscussionFeedRow<T extends DiscussionFeedItem> =
  | {
      kind: "day";
      key: string;
      label: string;
    }
  | {
      kind: "message";
      key: string;
      item: T;
      grouped: boolean;
    };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function dateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";

  const today = new Date();
  const startOf = (item: Date) =>
    new Date(item.getFullYear(), item.getMonth(), item.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function buildDiscussionFeed<T extends DiscussionFeedItem>(
  messages: T[],
): DiscussionFeedRow<T>[] {
  const rows: DiscussionFeedRow<T>[] = [];
  let previousDay: string | null = null;
  let previousSender: string | null = null;
  let previousTime = 0;

  for (const item of messages) {
    const currentDay = dateKey(item.createdAt);
    const currentTime = new Date(item.createdAt).getTime();

    if (currentDay !== previousDay) {
      rows.push({
        kind: "day",
        key: `day-${currentDay}`,
        label: dayLabel(item.createdAt),
      });
      previousDay = currentDay;
      previousSender = null;
      previousTime = 0;
    }

    const grouped =
      previousSender === item.senderMembershipId &&
      Number.isFinite(currentTime) &&
      previousTime > 0 &&
      currentTime - previousTime <= GROUP_WINDOW_MS;

    rows.push({
      kind: "message",
      key: item.id,
      item,
      grouped,
    });

    previousSender = item.senderMembershipId;
    previousTime = Number.isFinite(currentTime) ? currentTime : 0;
  }

  return rows;
}

export function countNewDiscussionMessages<T extends { id: string }>(
  previous: T[],
  current: T[],
) {
  if (previous.length === 0) return 0;
  const previousIds = new Set(previous.map((item) => item.id));
  return current.reduce(
    (count, item) => count + (previousIds.has(item.id) ? 0 : 1),
    0,
  );
}
