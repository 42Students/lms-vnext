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

/** Server sends the full six-digit PostgreSQL timestamp alongside the regular
 * ISO date. Preserve database keyset ordering when combining old pages with
 * live polling. Date.parse() discards sub-millisecond precision. */
export type DiscussionHistoryItem = {
  id: string;
  createdAtExact: string;
};

export function mergeDiscussionHistory<T extends DiscussionHistoryItem>(
  previous: readonly T[],
  incoming: readonly T[],
): T[] {
  const byId = new Map(previous.map((message) => [message.id, message]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort((a, b) =>
    a.createdAtExact.localeCompare(b.createdAtExact) ||
    a.id.localeCompare(b.id),
  );
}

/**
 * A live refresh is authoritative for its newest server page. Retain older
 * pages that are outside that window, but discard posts removed from the
 * current latest page (including a concurrent moderator deletion).
 */
export function reconcileLatestDiscussionPage<T extends DiscussionHistoryItem>(
  previous: readonly T[],
  latest: readonly T[],
  serverPageCount = latest.length,
  pageLimit = 60,
  locallyDeletedIds: ReadonlySet<string> = new Set<string>(),
): T[] {
  // A moderator removal or the viewer's own tombstone must stay removed when
  // an older page arrives late. The server remains authoritative for every
  // record in its latest window; local delete IDs only narrow the result.
  const sortedLatest = mergeDiscussionHistory(
    [], latest.filter(row => !locallyDeletedIds.has(row.id)),
  );
  if (serverPageCount < pageLimit || sortedLatest.length === 0) {
    return sortedLatest;
  }
  const oldest = sortedLatest[0]!;
  const older = previous.filter((row) =>
    !locallyDeletedIds.has(row.id) && (
      row.createdAtExact < oldest.createdAtExact ||
      (row.createdAtExact === oldest.createdAtExact && row.id < oldest.id)
    ),
  );
  return mergeDiscussionHistory(older, sortedLatest);
}
