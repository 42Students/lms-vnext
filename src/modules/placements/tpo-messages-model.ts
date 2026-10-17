export const TPO_MESSAGE_STATUSES = [
  "ALL",
  "UNREAD",
  "REPLY",
  "READ",
  "EMPTY",
] as const;

export type TpoMessageStatus =
  (typeof TPO_MESSAGE_STATUSES)[number];

export type TpoMessageSource =
  | "RECRUITER_THREADS"
  | "PLACEMENT_NOTIFICATIONS";

export type TpoInboxRecord = {
  id: string;
  source: TpoMessageSource;
  participantName: string;
  subject: string;
  status: Exclude<TpoMessageStatus, "ALL">;
  occurredAt: Date;
  jobId: string | null;
  messageCount: number | null;
  unreadCount: number | null;
  lastPreview?:string|null;
  waitingForYou?:boolean;
  companyName?:string|null;
  accessEnded?:boolean;
  bodySearchMatch?:boolean;
};

export type TpoInboxFilters = {
  status: TpoMessageStatus;
  q: string;
  from: Date | null;
  to: Date | null;
  page: number;
  pageSize: number;
};

export function deriveRecruiterThreadStatus(input: {
  messageCount: number;
  unreadRecruiterMessages: number;
}): Exclude<TpoMessageStatus, "ALL"> {
  if (input.messageCount === 0) return "EMPTY";
  return input.unreadRecruiterMessages > 0
    ? "UNREAD"
    : "READ";
}

/**
 * A source-agnostic read model, not a combined feed.
 *
 * Recruiter threads and in-app notification deliveries have
 * different read semantics. They must never be merged into
 * a single misleading conversation count.
 */
export function getTpoMessagesPage(
  records: readonly TpoInboxRecord[],
  filters: TpoInboxFilters,
) {
  const q = filters.q.trim().toLocaleLowerCase("en-IN");

  const filtered = records
    .filter((record) => {
      if(filters.status==="REPLY"&&!record.waitingForYou)return false;
      if (
        filters.status !== "ALL" && filters.status!=="REPLY" &&
        record.status !== filters.status
      ) {
        return false;
      }

      const timestamp = record.occurredAt.getTime();

      if (
        filters.from &&
        timestamp < filters.from.getTime()
      ) {
        return false;
      }

      if (
        filters.to &&
        timestamp > filters.to.getTime()
      ) {
        return false;
      }

      if (q) {
        const searchable =
          `${record.participantName} ${record.companyName??""} ${record.subject} ${record.lastPreview??""}`
            .toLocaleLowerCase("en-IN");

        if (!searchable.includes(q) && !record.bodySearchMatch) return false;
      }

      return true;
    })
    .sort(
      (a, b) =>
        b.occurredAt.getTime() -
          a.occurredAt.getTime() ||
        a.id.localeCompare(b.id),
    );

  const totalPages = Math.ceil(
    filtered.length / filters.pageSize,
  );

  const offset =
    (filters.page - 1) * filters.pageSize;

  return {
    total: filtered.length,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages,
    items: filtered.slice(
      offset,
      offset + filters.pageSize,
    ),
  };
}

/**
 * Summary counts describe the available, selected source
 * across the full authorized college scope before page,
 * search, status or date filters are applied.
 */
export function summarizeTpoMessages(
  records: readonly TpoInboxRecord[],
) {
  return {
    total: records.length,
    reply:records.filter(record=>record.waitingForYou).length,
    unread: records.filter(
      (record) => record.status === "UNREAD",
    ).length,
    read: records.filter(
      (record) => record.status === "READ",
    ).length,
    empty: records.filter(
      (record) => record.status === "EMPTY",
    ).length,
  };
}

/**
 * Never project arbitrary activity titles or notification
 * bodies. Those fields can include student contact details
 * and free-text notes.
 *
 * Persisted event types are used only when they conform to
 * an operational identifier shape; otherwise the label is
 * deliberately generic.
 */
export function safePlacementNotificationSubject(
  eventType: string,
) {
  if (
    !/^[A-Z][A-Z0-9_.-]{0,119}$/.test(eventType)
  ) {
    return "Placement notification";
  }

  return `Placement notification · ${eventType.replaceAll(
    /[_.-]+/g,
    " ",
  )}`;
}

export function tpoMessagesHref(input: {
  status?: TpoMessageStatus;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  if (input.status && input.status !== "ALL") {
    params.set("status", input.status);
  }
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  if (input.q) params.set("q", input.q);

  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  if (input.pageSize && input.pageSize !== 25) {
    params.set("pageSize", String(input.pageSize));
  }

  const query = params.toString();

  return query
    ? `/tpo/messages?${query}`
    : "/tpo/messages";
}
